import React, { useState } from 'react';
import type { ActionableItem } from '../../types';
import { Loader2, Check, Calendar, ExternalLink } from 'lucide-react';

interface ActionableCardProps {
    item: ActionableItem;
    onSnooze: (item: ActionableItem) => void;
    onComplete: (item: ActionableItem) => Promise<void>;
    onViewNotes: (item: ActionableItem) => void;
}

const ActionableCard: React.FC<ActionableCardProps> = ({ item, onSnooze, onComplete, onViewNotes }) => {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleCompleteClick = async () => {
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
            case 'extreme': return 'var(--danger)';      // Red for >45
            case 'critical': return 'var(--warning)';    // Golden for 30-44
            case 'high': return 'var(--success)';        // Green for <30 (Normal)
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
        <div
            className="actionable-card"
            style={{
                borderLeftColor: borderColor,
                ...(isSnoozeExpired ? {
                    border: '1px solid var(--danger)',
                    borderLeftWidth: '4px',
                    background: 'rgba(239, 68, 68, 0.05)'
                } : {})
            }}
        >
            <div className="card-layout">
                {/* Left Column: Days & Platform */}
                <div className="left-col">
                    <div className="days-box" style={{ borderColor: borderColor }}>
                        <span className="days-number">{item.pendingDays}</span>
                        <span className="days-label">Days</span>
                    </div>
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

                    <div
                        className="latest-note-pill"
                        style={{ height: 'auto', minHeight: '40px', alignItems: 'flex-start', cursor: 'pointer' }}
                        onClick={() => onViewNotes(item)}
                        title="Click to view full notes"
                    >
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', lineHeight: '1.2' }}>
                            {item.displayNotes || ''}
                        </p>
                    </div>

                    <div className="card-actions">
                        <a href={item.platformLink} target="_blank" rel="noopener noreferrer" className="action-btn platform-btn" title="Open Platform">
                            <ExternalLink size={14} />
                            Platform
                        </a>
                        <button className="action-btn snooze-btn" onClick={() => onSnooze(item)}>
                            <Calendar size={14} />
                            Snooze
                        </button>
                        <button
                            className={`action-btn complete-btn ${isCompleting ? 'loading' : ''}`}
                            onClick={handleCompleteClick}
                            disabled={isCompleting}
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 size={14} className="spin" />
                                    Wait...
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    Done
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
                    min-width: 360px; 
                    width: 360px;
                    height: 220px;
                    display: flex;
                    flex-direction: column;
                    scroll-snap-align: start;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                    box-sizing: border-box;
                }
                
                .right-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    min-width: 0;
                    height: 100%;
                    overflow: hidden;
                }

                .latest-note-pill {
                    background: rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.08); 
                    border-radius: 6px;
                    padding: 6px 8px;
                    flex: 1;
                    min-height: 0; 
                    overflow-y: auto;
                    display: block;
                    margin-bottom: 2px;
                }
                .latest-note-pill p {
                    margin: 0;
                    font-size: 0.7rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: pre-wrap;
                }
                .snooze-expired-mode {
                    border: 1px solid var(--danger) !important;
                    border-left-width: 4px !important;
                    background: rgba(239, 68, 68, 0.05);
                }
                .expired-pill {
                    background: var(--danger);
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 800;
                    display: inline-flex;
                    padding: 2px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.4rem;
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
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    white-space: nowrap;
                }
                .actionable-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .card-layout {
                    display: flex;
                    gap: 0.8rem;
                    flex: 1;
                    overflow: hidden;
                }
                
                .left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: center;
                    width: 50px;
                    flex-shrink: 0;
                }
                .days-box {
                    width: 48px;
                    height: 48px;
                    border: 2px solid;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-overlay);
                }
                .days-number {
                    font-size: 1rem;
                    font-weight: 800;
                    line-height: 1;
                    color: var(--text-primary);
                }
                .days-label {
                    font-size: 0.5rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-top: 1px;
                }
                
                .content-top {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                    flex-shrink: 0;
                }
                .candidate-name {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .company-role {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .company-role span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dot { opacity: 0.5; }

                .status-container {
                    min-height: 20px;
                    display: flex;
                    align-items: center;
                    margin-top: 1px;
                    flex-shrink: 0;
                }
                .status-pill {
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 1px 8px;
                    border-radius: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                .latest-note-pill::-webkit-scrollbar {
                    width: 4px;
                }
                .latest-note-pill::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.2);
                    border-radius: 4px;
                }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: auto;
                    padding-top: 0.2rem;
                    flex-shrink: 0;
                }
                .action-btn {
                    flex: 1;
                    padding: 6px 4px;
                    border-radius: 6px;
                    border: 1px solid transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    white-space: nowrap;
                    min-width: 0;
                }
                .platform-btn {
                    color: #ec4899;
                    background: rgba(236, 72, 153, 0.1);
                    text-decoration: none;
                }
                .platform-btn:hover {
                    background: #ec4899;
                    color: white;
                }
                .snooze-btn {
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }
                .snooze-btn:hover {
                    background: #3b82f6;
                    color: white;
                }
                .complete-btn {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .complete-btn:hover {
                    background: var(--success);
                    color: white;
                }
                .complete-btn.loading {
                    position: relative;
                    overflow: hidden;
                    cursor: not-allowed;
                    opacity: 0.8;
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
