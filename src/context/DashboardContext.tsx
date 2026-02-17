import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ActionableItem, KamStat } from '../types';
import { fetchPostTBRRecords, fetchICRecords } from '../services/airtableService';
import { normalizePostTBR, normalizeICData } from '../services/transformers';

interface DashboardContextType {
    actionables: ActionableItem[];
    loading: boolean;
    activeSource: string;
    setActiveSource: (source: string) => void;
    activeView: 'ALL' | 'NEW';
    setActiveView: (view: 'ALL' | 'NEW') => void;
    selectedKam: string[];
    setSelectedKam: (kams: string[]) => void;
    timelineFilter: 'ALL' | '10_PLUS' | '30_PLUS' | '45_PLUS';
    setTimelineFilter: (filter: 'ALL' | '10_PLUS' | '30_PLUS' | '45_PLUS') => void;
    refreshData: (silent?: boolean) => Promise<void>;
    removeLocalItem: (id: string) => void;
    markAsHandled: (id: string) => void;
    kamLeaderboard: KamStat[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rawActionables, setRawActionables] = useState<ActionableItem[]>([]);
    // Load completed IDs from localStorage on init
    const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('completed_actionable_ids');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [loading, setLoading] = useState(true);
    const [activeSource, setActiveSource] = useState('ALL');
    const [activeView, setActiveView] = useState<'ALL' | 'NEW'>('ALL');
    const [selectedKam, setSelectedKam] = useState<string[]>([]);
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | '10_PLUS' | '30_PLUS' | '45_PLUS'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

    // Sync completedIds to localStorage
    useEffect(() => {
        localStorage.setItem('completed_actionable_ids', JSON.stringify(Array.from(completedIds)));
    }, [completedIds]);

    const refreshData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // 1. Fetch raw data from Airtable
            const [postTbrRaw, icRaw] = await Promise.all([
                fetchPostTBRRecords(),
                fetchICRecords()
            ]);

            // 2. Normalize 
            const postTbr = normalizePostTBR(postTbrRaw);
            const ic = normalizeICData(icRaw);
            const allItems = [...postTbr, ...ic];

            // 3. Cleanup completedIds and handledIds
            const fetchedIds = new Set(allItems.map(i => i.id));

            setCompletedIds(prev => {
                const next = new Set(prev);
                let changed = false;
                next.forEach(id => {
                    if (!fetchedIds.has(id)) {
                        next.delete(id);
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });

            // Cleanup handledIds if they are now filtered out by backend logic (though backend doesn't filter comments)
            // Or better: keep them until the fetch returns the updated note/snooze
            setHandledIds(prev => {
                const next = new Set(prev);
                let changed = false;
                allItems.forEach(item => {
                    if (next.has(item.id)) {
                        // Check if backend now reflects "handled" state
                        const notes = (item.displayNotes || "") + (item.schedulerNotes || "");
                        if (notes.trim().length > 0 || item.snoozeUntil) {
                            next.delete(item.id);
                            changed = true;
                        }
                    }
                });
                return changed ? next : prev;
            });

            setRawActionables(allItems);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const removeLocalItem = (id: string) => {
        setCompletedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const markAsHandled = (id: string) => {
        setHandledIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    // Helper to determine if an item is "New"
    const isNewItem = (item: ActionableItem) => {
        if (handledIds.has(item.id)) return false;

        const hasComments = (item.displayNotes && item.displayNotes.trim().length > 0) ||
            (item.schedulerNotes && item.schedulerNotes.trim().length > 0);
        const hasSnooze = !!item.snoozeUntil;
        return !hasComments && !hasSnooze;
    };

    // Memoized base actionables (only filters completed)
    const baseActionables = React.useMemo(() => {
        return rawActionables.filter(item => {
            // Priority 1: Check if it's in our local "just completed" set
            if (completedIds.has(item.id)) return false;

            // Priority 2: Check if the Airtable data already has the completed marker
            const notes = item.displayNotes || "";
            return !notes.match(/\[COMPLETED:\s*\d{4}-\d{2}-\d{2}\]/);
        });
    }, [rawActionables, completedIds]);

    // Derived state for all items currently filtered by Source and Search
    const filteredBaseItems = React.useMemo(() => {
        return baseActionables.filter(item => {
            if (activeSource !== 'ALL' && item.source !== activeSource) return false;
            if (searchQuery && !item.candidateName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [baseActionables, activeSource, searchQuery]);

    // Final actionables based on Active View (respects ALL vs NEW)
    const actionables = React.useMemo(() => {
        if (activeView === 'NEW') {
            return filteredBaseItems.filter(isNewItem);
        }
        return filteredBaseItems;
    }, [filteredBaseItems, activeView]);

    useEffect(() => {
        refreshData();
    }, []);

    // Derived state for KAM leaderboard (respects source, search, AND activeView)
    const kamLeaderboard = React.useMemo(() => {
        const counts: Record<string, number> = {};

        actionables.forEach(item => {
            const kamName = item.kam || "Unassigned";
            counts[kamName] = (counts[kamName] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [actionables]);

    return (
        <DashboardContext.Provider value={{
            actionables,
            loading,
            activeSource,
            setActiveSource,
            activeView,
            setActiveView,
            selectedKam,
            setSelectedKam,
            timelineFilter,
            setTimelineFilter,
            refreshData,
            removeLocalItem,
            markAsHandled,
            kamLeaderboard,
            searchQuery,
            setSearchQuery
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard must be used within a DashboardProvider");
    return context;
};
