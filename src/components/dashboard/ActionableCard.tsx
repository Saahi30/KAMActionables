import React, { useState } from 'react';
import type { ActionableItem } from '../../types';
import { Loader2, Check, Calendar } from 'lucide-react';

interface ActionableCardProps {
    item: ActionableItem;
    onSnooze: (item: ActionableItem) => void;
    onComplete: (item: ActionableItem) => Promise<void>;
}

const ActionableCard: React.FC<ActionableCardProps> = ({ item, onSnooze, onComplete }) => {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleCompleteClick = async () => {
        if (!confirm(`Mark ${item.candidateName} as complete?`)) return;

        setIsCompleting(true);
        // Delay for 4 seconds to allow the slow "filling" animation to play
        await new Promise(resolve => setTimeout(resolve, 4000));
        try {
            await onComplete(item);
        } finally {
            setIsCompleting(false);
        }
    };

    const getSeverityColor = (s: string) => {
        switch (s) {
            case 'extreme': return 'var(--danger)';      // Red for 45+
            case 'critical': return 'var(--warning)';    // Golden for 30-44
            case 'high': return 'var(--success)';        // Green for 15-29 (Normal)
            default: return 'var(--success)';            // Green for Others
        }
    };

    const getStatusStyle = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('waiting')) return { bg: '#ffda79', text: '#000' };
        if (s.includes('availabilities')) return { bg: '#99eaff', text: '#000' };
        if (s.includes('completed')) return { bg: '#a9e6a2', text: '#000' };
        if (s.includes('edge case')) return { bg: '#b51a89', text: '#fff' };
        return { bg: 'var(--bg-card)', text: 'var(--text-primary)' };
    };

    const statusStyle = getStatusStyle(item.status);
    const borderColor = getSeverityColor(item.severity);
    const today = new Date().toISOString().split("T")[0];
    const isSnoozeExpired = !!(item.snoozeUntil && item.snoozeUntil <= today);
    const snoozeDaysLeft = item.snoozeUntil
        ? Math.ceil((new Date(item.snoozeUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className={`actionable-card ${isSnoozeExpired ? 'snooze-expired-mode' : ''}`} style={{ borderLeftColor: borderColor }}>
            <div className="card-layout">
                {/* Left Column: Days & Platform */}
                <div className="left-col">
                    <div className="days-box" style={{ borderColor: borderColor }}>
                        <span className="days-number">{item.pendingDays}</span>
                        <span className="days-label">Days</span>
                    </div>
                    <a href={item.platformLink} target="_blank" rel="noopener noreferrer" className="platform-pill" title="Open Platform">
                        Platform
                    </a>
                </div>

                {/* Right Column: Content */}
                <div className="right-col">
                    <div className="content-top">
                        {isSnoozeExpired && (
                            <div className="expired-pill">🚨 SNOOZE EXPIRED</div>
                        )}
                        <div className="title-row">
                            <h4 className="candidate-name">{item.candidateName}</h4>
                            {item.snoozeUntil && !isSnoozeExpired && (
                                <div className="snooze-countdown">
                                    🕓 {snoozeDaysLeft}d left
                                </div>
                            )}
                        </div>
                        <div className="company-role">
                            <span className="company">{item.company}</span>
                            <span className="dot">•</span>
                            <span className="role">{item.role}</span>
                        </div>
                        <div className="status-container">
                            <div className="status-pill" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                                {item.status}
                            </div>
                        </div>
                    </div>

                    <div className="latest-note-pill">
                        <p>{(() => {
                            if (!item.displayNotes) return '';
                            const lastLine = item.displayNotes.split('\n').pop() || '';
                            // Remove [YYYY-MM-DD], [SNOOZE: ...], or [COMPLETED: ...]
                            return lastLine
                                .replace(/^\[\d{4}-\d{2}-\d{2}\]\s*/, '') // Remove date
                                .replace(/\[SNOOZE:.*?\]\s*/, '')        // Remove snooze marker
                                .replace(/\[COMPLETED:.*?\]\s*/, '')    // Remove completed marker
                                .trim();
                        })()}</p>
                    </div>

                    <div className="card-actions">
                        <button className="action-btn snooze-btn" onClick={() => onSnooze(item)}>
                            <Calendar size={14} />
                            Snooze
                        </button>
                        <button
                            className={`complete-btn ${isCompleting ? 'loading' : ''}`}
                            onClick={handleCompleteClick}
                            disabled={isCompleting}
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 size={14} className="spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    Complete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .actionable-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-card);
                    border-left: 4px solid; 
                    border-radius: 12px;
                    padding: 0.6rem;
                    min-width: 300px;
                    width: fit-content;
                    max-width: 500px; 
                    min-height: 140px;
                    display: flex;
                    flex-direction: column;
                    scroll-snap-align: start;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                }
                .snooze-expired-mode {
                    border: 1px solid var(--danger) !important;
                    border-left-width: 4px !important;
                    background: rgba(239, 68, 68, 0.05);
                }
                .expired-pill {
                    background: var(--danger);
                    color: white;
                    font-size: 0.55rem;
                    font-weight: 800;
                    display: inline-flex;
                    padding: 1px 6px;
                    border-radius: 4px;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.2rem;
                    text-transform: uppercase;
                    width: fit-content;
                }
                .title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    width: 100%;
                    gap: 0.75rem;
                }
                .snooze-countdown {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 1px 5px;
                    border-radius: 4px;
                    white-space: nowrap;
                }
                .actionable-card:hover {
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                }
                .card-layout {
                    display: flex;
                    gap: 0.6rem;
                    flex: 1;
                }
                
                /* Left Column */
                .left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    align-items: center;
                    width: 45px;
                }
                .days-box {
                    width: 42px;
                    height: 42px;
                    border: 2px solid;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-overlay);
                }
                .days-number {
                    font-size: 0.85rem;
                    font-weight: 800;
                    line-height: 1;
                    color: var(--text-primary);
                }
                .days-label {
                    font-size: 0.45rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-top: 1px;
                }
                .platform-pill {
                    margin-top: auto;
                    padding: 4px 8px;
                    border-radius: 20px;
                    background: #f472b6; /* Pink color from image */
                    color: black;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-decoration: none;
                    text-align: center;
                    width: 100%;
                    transition: opacity 0.2s;
                }
                .platform-pill:hover {
                    opacity: 0.9;
                }

                /* Right Column */
                .right-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    min-width: fit-content; /* Ensure it grows with content */
                }
                .content-top {
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                }
                .candidate-name {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    letter-spacing: -0.01em;
                    line-height: 1.1;
                    display: block;
                    word-break: break-word;
                }
                .company-role {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-top: 1px;
                }
                .company, .role {
                    white-space: nowrap;
                }
                .company {
                    color: var(--text-primary);
                    opacity: 0.8;
                }
                .role {
                    flex-shrink: 2; /* Prioritize showing company over role if space is tight */
                }
                .dot {
                    color: var(--text-secondary);
                    opacity: 0.5;
                    font-size: 0.8rem;
                }
                .status-container {
                    height: 20px;
                    display: flex;
                    align-items: center;
                }
                .status-pill {
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 1px 6px;
                    border-radius: 12px;
                    align-self: flex-start;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .latest-note-pill {
                    background: var(--bg-overlay);
                    padding: 4px 10px;
                    border-radius: 6px;
                    border: 1px solid var(--bg-card);
                    align-self: stretch;
                    min-height: 28px;
                    display: flex;
                    align-items: center;
                }
                .latest-note-pill p {
                    margin: 0;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: auto;
                    padding-top: 0.4rem;
                }
                .action-btn {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid var(--bg-card);
                    background: var(--bg-overlay);
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .snooze-btn {
                    color: #3b82f6;
                    border-color: rgba(59, 130, 246, 0.3);
                    background: rgba(59, 130, 246, 0.05);
                    gap: 0.4rem;
                }
                .snooze-btn:hover {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
                .complete-btn {
                    margin-left: auto;
                    padding: 6px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    transition: all 0.2s;
                }
                .complete-btn:hover {
                    background: var(--success);
                    color: white;
                }
                .complete-btn.loading {
                    position: relative;
                    overflow: hidden;
                    background: rgba(16, 185, 129, 0.2);
                    border-color: var(--success);
                    cursor: not-allowed;
                }
                .complete-btn.loading::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 100%;
                    background: var(--success);
                    opacity: 0.3;
                    animation: fillAnimation 4s ease-in-out forwards;
                }
                @keyframes fillAnimation {
                    0% { width: 0; }
                    100% { width: 100%; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ActionableCard;
