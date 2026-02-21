import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import KPISection from './KPISection';
import ActionableCard from './ActionableCard';
import ActionModal from './ActionModal';
import type { ActionableItem } from '../../types';
import { markItemComplete } from '../../services/backendService';
import { Check } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { actionables, loading, refreshData, removeLocalItem, timelineFilter, selectedKam, activeSource, searchQuery } = useDashboard();

    // Modal State
    const [modalItem, setModalItem] = useState<ActionableItem | null>(null);
    const [notification, setNotification] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const [viewNoteItem, setViewNoteItem] = useState<ActionableItem | null>(null);

    const showNotification = (message: string) => {
        setNotification({ message, visible: true });
        setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleViewNotes = (item: ActionableItem) => {
        setViewNoteItem(item);
    };

    // Render notes text with clickable links
    const renderNotesWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split('\n').map((line, lineIdx) => {
            const parts = line.split(urlRegex);
            return (
                <span key={lineIdx}>
                    {parts.map((part, i) =>
                        urlRegex.test(part) ? (
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#3b82f6',
                                    textDecoration: 'underline',
                                    wordBreak: 'break-all',
                                    fontWeight: 600
                                }}
                            >
                                {part}
                            </a>
                        ) : (
                            <span key={i}>{part}</span>
                        )
                    )}
                    {lineIdx < text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    // 1. Base Filter (Always applied) - Source + KAM + Snooze + Search
    const baseItems = actionables.filter(item => {
        // Search Filter (Candidate Name OR Company Name)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesCandidate = item.candidateName.toLowerCase().includes(query);
            const matchesCompany = item.company.toLowerCase().includes(query);
            if (!matchesCandidate && !matchesCompany) return false;
        }

        // Source Filter
        if (activeSource !== 'ALL' && item.source !== activeSource) return false;

        // KAM Filter
        if (selectedKam.length > 0 && !selectedKam.includes(item.kam)) return false;

        return true;
    });

    // 2. Display Items (Also respects timelineFilter from Header)
    const filteredItems = baseItems.filter(item => {
        if (timelineFilter === '45_PLUS' && item.pendingDays < 45) return false;
        if (timelineFilter === '30_PLUS' && (item.pendingDays < 30 || item.pendingDays >= 45)) return false;
        if (timelineFilter === '10_PLUS' && (item.pendingDays < 10 || item.pendingDays >= 30)) return false;
        return true;
    });

    // Bucketing for Swimlanes
    const sortWithSnooze = (a: ActionableItem, b: ActionableItem) => {
        const today = new Date().toISOString().split("T")[0];
        const aExpired = a.snoozeUntil && a.snoozeUntil <= today;
        const bExpired = b.snoozeUntil && b.snoozeUntil <= today;

        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;

        return b.pendingDays - a.pendingDays;
    };

    const criticalItems = filteredItems.filter(i => i.pendingDays >= 45).sort(sortWithSnooze);
    const attentionItems = filteredItems.filter(i => i.pendingDays >= 30 && i.pendingDays < 45).sort(sortWithSnooze);
    const normalItems = filteredItems.filter(i => i.pendingDays < 30).sort(sortWithSnooze);

    const handleComplete = async (item: ActionableItem) => {
        try {
            // Step 1: Optimistic UI update - remove immediately
            removeLocalItem(item.id);

            // Step 2: Update backend (updates both Airtable and SQL database)
            await markItemComplete(item);

            // Step 3: Show success notification immediately
            showNotification(`${item.candidateName} submitted! ✅`);

            // Step 4: Delayed silent refresh to ensure data consistency
            // Wait 5 seconds for Airtable/SQL to propagate the changes
            setTimeout(async () => {
                await refreshData(true);
            }, 5000);

        } catch (e) {
            console.error("Failed to complete:", e);
            alert("Failed to complete: " + e);
            // On error, do a full refresh to restore correct state
            await refreshData();
        }
    };

    if (loading) return <div className="loading">Loading Actionables...</div>;

    return (
        <div className="dashboard-container">
            <KPISection />

            <div className="swimlanes">
                <div className="swimlane critical">
                    <div className="swimlane-header critical">
                        <h3>Critical (45+ Days)</h3>
                    </div>
                    <div className="card-list">
                        {criticalItems.map(item => (
                            <ActionableCard
                                key={item.id}
                                item={item}
                                onSnooze={() => { setModalItem(item); }}
                                onComplete={handleComplete}
                                onViewNotes={handleViewNotes}
                            />
                        ))}
                        {criticalItems.length === 0 && <div className="empty-state">No critical items</div>}
                    </div>
                </div>

                <div className="swimlane attention">
                    <div className="swimlane-header attention">
                        <h3>Attention (30-44 Days)</h3>
                    </div>
                    <div className="card-list">
                        {attentionItems.map(item => (
                            <ActionableCard
                                key={item.id}
                                item={item}
                                onSnooze={() => { setModalItem(item); }}
                                onComplete={handleComplete}
                                onViewNotes={handleViewNotes}
                            />
                        ))}
                        {attentionItems.length === 0 && <div className="empty-state">No items needing attention</div>}
                    </div>
                </div>

                <div className="swimlane normal">
                    <div className="swimlane-header normal">
                        <h3>Normal (10-29 Days)</h3>
                    </div>
                    <div className="card-list">
                        {normalItems.map(item => (
                            <ActionableCard
                                key={item.id}
                                item={item}
                                onSnooze={() => { setModalItem(item); }}
                                onComplete={handleComplete}
                                onViewNotes={handleViewNotes}
                            />
                        ))}
                        {normalItems.length === 0 && <div className="empty-state">No normal items</div>}
                    </div>
                </div>
            </div>

            {notification.visible && (
                <div className="toast-notification">
                    <Check size={16} />
                    {notification.message}
                </div>
            )}

            {modalItem && (
                <ActionModal
                    item={modalItem}
                    onClose={() => { setModalItem(null); }}
                />
            )}

            {viewNoteItem && (
                <div className="notes-modal-overlay" onClick={() => setViewNoteItem(null)}>
                    <div className="notes-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="notes-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="notes-icon-wrapper">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="notes-modal-title">{viewNoteItem.candidateName}</h3>
                                    <p className="notes-modal-subtitle">Notes History</p>
                                </div>
                            </div>
                            <button onClick={() => setViewNoteItem(null)} className="notes-close-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="notes-modal-body">
                            <div className="notes-text-container">
                                <pre className="notes-text-content">
                                    {viewNoteItem.displayNotes
                                        ? renderNotesWithLinks(viewNoteItem.displayNotes)
                                        : "No notes available."}
                                </pre>
                            </div>
                        </div>
                        <div className="notes-modal-footer">
                            <button onClick={() => setViewNoteItem(null)} className="notes-footer-close-btn">Close</button>
                        </div>
                    </div>
                </div>
            )}



            <style>{`
            /* Notes Modal Styles */
            .notes-modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                animation: fadeIn 0.2s ease-out;
            }
            .notes-modal-content {
                background: var(--bg-card);
                width: 100%;
                max-width: 650px;
                max-height: 85vh;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.1);
                animation: zoomIn 0.2s ease-out;
            }
            .notes-modal-header {
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-secondary);
            }
            .notes-icon-wrapper {
                padding: 8px;
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notes-modal-title {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-primary);
                line-height: 1.2;
            }
            .notes-modal-subtitle {
                margin: 0;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-secondary);
                margin-top: 2px;
            }
            .notes-close-btn {
                background: transparent;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            .notes-close-btn:hover {
                background: rgba(0,0,0,0.05);
                color: var(--text-primary);
            }
            .notes-modal-body {
                padding: 1.5rem;
                overflow-y: auto;
                background: var(--bg-overlay, #f9fafb);
                flex: 1;
            }
            [data-theme='dark'] .notes-modal-body {
                background: #111215;
            }
            .notes-text-container {
                background: var(--bg-card);
                border: 1px solid var(--border-color, rgba(0,0,0,0.1));
                border-radius: 12px;
                padding: 1.25rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
            .notes-text-content {
                white-space: pre-wrap;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.9rem;
                color: var(--text-primary);
                line-height: 1.6;
                margin: 0;
            }
            .notes-modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid var(--border-color, rgba(0,0,0,0.1));
                background: var(--bg-secondary);
                display: flex;
                justify-content: flex-end;
            }
            .notes-footer-close-btn {
                padding: 0.6rem 1.5rem;
                background: var(--text-primary);
                color: var(--bg-card);
                border: none;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: transform 0.1s;
            }
            .notes-footer-close-btn:hover {
                transform: translateY(-1px);
                opacity: 0.9;
            }
            
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

            .toast-notification {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                background: var(--success);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 50px;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                font-weight: 600;
                z-index: 9999;
                animation: slideIn 0.3s ease-out;
            }
            @keyframes slideIn {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--text-secondary);
                font-size: 1.2rem;
            }
            .dashboard-container {
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow-y: hidden; /* Main container fixed */
            }
            .swimlanes {
                display: flex;
                flex-direction: column; /* Vertical stack of categories */
                gap: 0.2rem;
                flex: 1;
                overflow-y: auto; /* Allow vertical scrolling of the categories list */
                padding: 0.5rem;
            }
            .swimlane {
                /* Removed flex: 1 to suggest auto height based on content or fixed height */
                display: flex;
                flex-direction: column;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 8px;
                padding: 0.3rem 0.75rem;
                min-width: 0;
            }
            .swimlane-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.2rem;
                padding-bottom: 0.2rem;
                border-bottom: 1px solid;
            }
            .swimlane-header h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
            }
            .swimlane-header.critical { border-color: var(--danger); color: var(--danger); }
            .swimlane-header.attention { border-color: var(--warning); color: var(--warning); }
            .swimlane-header.normal { border-color: var(--success); color: var(--success); }

            .swimlane.critical { background: rgba(239, 68, 68, 0.04); }
            .swimlane.attention { background: rgba(250, 204, 21, 0.04); }
            .swimlane.normal { background: rgba(6, 78, 59, 0.04); }

            [data-theme='light'] .swimlane.critical { background: rgba(220, 38, 38, 0.05); }
            [data-theme='light'] .swimlane.attention { background: rgba(202, 138, 4, 0.05); }
            [data-theme='light'] .swimlane.normal { background: rgba(6, 78, 59, 0.05); }
            
            .count {
                background: var(--bg-card);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                color: var(--text-primary);
            }
            .card-list {
                display: flex;
                flex-direction: row; /* Horizontal cards */
                gap: 1.25rem;
                overflow-x: auto; /* Horizontal scroll */
                padding: 0.5rem 0.5rem 1rem 0.5rem; /* Bottom padding for scrollbar */
                scroll-behavior: smooth;
                scroll-snap-type: x mandatory;
                width: 100%;
                min-height: fit-content;
            }
            .card-list::-webkit-scrollbar {
                height: 6px;
            }
            .card-list::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
            }
            .card-list::-webkit-scrollbar-thumb {
                background: rgba(156, 163, 175, 0.5); /* Gray-400 with opacity */
                border-radius: 10px;
                transition: background 0.2s;
            }
            .card-list::-webkit-scrollbar-thumb:hover {
                background: rgba(107, 114, 128, 0.8); /* Gray-500 with opacity */
            }
            [data-theme='dark'] .card-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }
            [data-theme='dark'] .card-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
            }
            [data-theme='dark'] .card-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .empty-state {
                text-align: center;
                padding: 0.25rem 0;
                color: var(--text-secondary);
                font-style: italic;
                opacity: 0.7;
                width: 100%;
            }
            `}</style>
        </div >
    );
};

export default Dashboard;
