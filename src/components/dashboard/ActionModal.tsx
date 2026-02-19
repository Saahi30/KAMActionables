import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ActionableItem } from '../../types';
import { addComment } from '../../services/backendService';
import { useDashboard } from '../../context/DashboardContext';

interface ActionModalProps {
    item: ActionableItem | null;
    onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ item, onClose }) => {
    const { markAsHandled, updateLocalItem } = useDashboard();
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [snoozeDate, setSnoozeDate] = useState('');
    const [error, setError] = useState('');

    if (!item) return null;

    const handleSubmit = async () => {
        setError('');

        const trimmedComment = comment.trim();
        const hasSnooze = !!snoozeDate;

        // Validation: If snoozing, comment must be present
        if (hasSnooze && !trimmedComment) {
            setError('Please add a comment to snooze this item.');
            return;
        }

        if (!hasSnooze && !trimmedComment) {
            setError('Please add a comment or select a snooze date.');
            return;
        }

        const now = new Date().toISOString().split('T')[0];
        const finalComment = hasSnooze
            ? `[SNOOZE: ${snoozeDate}] ${trimmedComment}`
            : trimmedComment;
        const newEntry = `[${now}] ${finalComment}`;

        // ── OPTIMISTIC UPDATE ──────────────────────────────────────────
        // Append style (matches Retool + backendService): new entry at BOTTOM
        const optimisticNotes = item.displayNotes
            ? `${item.displayNotes}\n${newEntry}`
            : newEntry;

        updateLocalItem(item.id, {
            displayNotes: optimisticNotes,
            ...(hasSnooze ? { snoozeUntil: snoozeDate } : {})
        });
        markAsHandled(item.id);
        onClose(); // Close modal immediately — user sees the update on the card
        // ───────────────────────────────────────────────────────────────

        setLoading(true);
        try {
            await addComment(item, finalComment);
            // No refreshData here — the Weekday backend→Airtable sync takes a few minutes.
            // Fetching from Airtable immediately would return stale data and overwrite
            // the optimistic patch above. The UI is already correct. On next page load
            // Airtable will have the correct synced data.
        } catch (error) {
            console.error('Failed to save comment, rolling back optimistic update:', error);
            // Rollback: restore original state on failure
            updateLocalItem(item.id, {
                displayNotes: item.displayNotes,
                snoozeUntil: item.snoozeUntil
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Snooze / Comment</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <p className="item-context">
                        {item.candidateName} • {item.company}
                    </p>

                    {error && <div className="error-message">{error}</div>}

                    <div className="snooze-options">
                        <label className="section-label">Snooze (Optional)</label>
                        <div className="quick-snooze">
                            <button
                                className={snoozeDate === calculateDate(1) ? 'active' : ''}
                                onClick={() => setSnoozeDate(calculateDate(1))}
                            >1 Day</button>
                            <button
                                className={snoozeDate === calculateDate(3) ? 'active' : ''}
                                onClick={() => setSnoozeDate(calculateDate(3))}
                            >3 Days</button>
                            <button
                                className={snoozeDate === calculateDate(7) ? 'active' : ''}
                                onClick={() => setSnoozeDate(calculateDate(7))}
                            >7 Days</button>
                            <button
                                className={snoozeDate === '' ? 'active' : ''}
                                onClick={() => setSnoozeDate('')}
                            >None</button>
                        </div>
                        <div className="custom-date">
                            <label>Custom Date</label>
                            <input
                                type="date"
                                value={snoozeDate}
                                onChange={e => setSnoozeDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="comment-section">
                        <label className="section-label">Internal Note</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Add reasoning or context..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; 
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: var(--bg-card);
                    width: 500px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: var(--text-primary);
                }
                .modal-header button {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .item-context {
                    margin-top: 0;
                    margin-bottom: 1.5rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .snooze-options {
                    margin-bottom: 1.5rem;
                }
                .quick-snooze {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .quick-snooze button {
                    flex: 1;
                    padding: 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-primary);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .quick-snooze button:hover {
                    border-color: var(--accent-primary);
                    background: rgba(59, 130, 246, 0.1);
                }
                .custom-date {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .custom-date input {
                    padding: 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-primary);
                    border-radius: 6px;
                }
                .comment-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .comment-section textarea {
                    padding: 0.75rem;
                    background: var(--bg-secondary);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-primary);
                    border-radius: 8px;
                    resize: vertical;
                    font-family: inherit;
                }
                .comment-section textarea:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                }
                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                .cancel-btn {
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin-bottom: 1.5rem;
                    font-size: 0.85rem;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .section-label {
                    display: block;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                    font-weight: 600;
                }
                .quick-snooze button.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
                .submit-btn {
                    padding: 0.5rem 1.5rem;
                    background: #3b82f6;
                    border: none;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .submit-btn:hover:not(:disabled) {
                    background: #2563eb;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ActionModal;
