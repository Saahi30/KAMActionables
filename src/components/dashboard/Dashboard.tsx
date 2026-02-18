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

    const showNotification = (message: string) => {
        setNotification({ message, visible: true });
        setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
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

        // Snooze Filter
        if (item.snoozeUntil) {
            const snoozeDate = new Date(item.snoozeUntil);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (snoozeDate > today) return false;
        }

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
            showNotification(`${item.candidateName} marked as complete!`);

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

            <style>{`
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
        </div>
    );
};

export default Dashboard;
