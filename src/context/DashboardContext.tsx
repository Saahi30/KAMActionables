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
    updateLocalItem: (id: string, patch: Partial<ActionableItem>) => void;
    markAsHandled: (id: string) => void;
    kamLeaderboard: KamStat[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    stats: {
        total: number;
        critical: number;
        attention: number;
        normal: number;
        viewCounts: { ALL: number; NEW: number };
        sourceCounts: { ALL: number; POST_TBR: number; IC: number };
    };
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
            console.warn(`[DIAGNOSTIC] Post-TBR: ${postTbr.length}, IC: ${ic.length}, Total: ${allItems.length}`);

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

    // Optimistic patch: instantly update a single item in local state
    const updateLocalItem = (id: string, patch: Partial<ActionableItem>) => {
        setRawActionables(prev =>
            prev.map(item => item.id === id ? { ...item, ...patch } : item)
        );
    };

    // Helper to determine if an item is "New"
    const isNewItem = (item: ActionableItem) => {
        if (handledIds.has(item.id)) return false;

        const today = new Date().toISOString().split("T")[0];
        const hasNotes = (item.displayNotes && item.displayNotes.trim().length > 0);

        // Check if snooze has expired (if it exists)
        const snoozeExpired = !!(item.snoozeUntil && item.snoozeUntil <= today);

        // A truly "New" item has NO notes at all, OR its snooze has expired.
        // The presence of a future snooze date implies there are notes (since we force notes on snooze),
        // so it will naturally return false here.
        return !hasNotes || snoozeExpired;
    };

    // Memoized base actionables — filters out optimistically removed (completed) items
    const baseActionables = React.useMemo(() => {
        return rawActionables.filter(item => !completedIds.has(item.id));
    }, [rawActionables, completedIds]);

    // 1. Source and Search Filter
    const sourceSearchFilteredItems = React.useMemo(() => {
        return baseActionables.filter(item => {
            // Priority 1: Source Filter
            if (activeSource !== 'ALL' && item.source !== activeSource) return false;

            // Priority 2: Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesCandidate = item.candidateName.toLowerCase().includes(query);
                const matchesCompany = item.company.toLowerCase().includes(query);
                if (!matchesCandidate && !matchesCompany) return false;
            }

            return true;
        });
    }, [baseActionables, activeSource, searchQuery]);

    // 2. View Filter (All vs New)
    const viewFilteredItems = React.useMemo(() => {
        if (activeView === 'NEW') {
            return sourceSearchFilteredItems.filter(isNewItem);
        }
        return sourceSearchFilteredItems;
    }, [sourceSearchFilteredItems, activeView, handledIds]);

    // 3. Final actionables (Dashboard content) - Filter by selected KAM
    const actionables = React.useMemo(() => {
        if (selectedKam.length > 0) {
            return viewFilteredItems.filter(item => {
                const itemKam = item.kam || "Unassigned";
                return selectedKam.includes(itemKam);
            });
        }
        return viewFilteredItems;
    }, [viewFilteredItems, selectedKam]);

    // KPI Stats - Pinned to current filter context
    const stats = React.useMemo(() => {
        // Base for KPI cards: respects Source + KAM + Search AND View Toggles
        const kpiBase = baseActionables.filter(item => {
            if (activeView === 'NEW' && !isNewItem(item)) return false;
            if (activeSource !== 'ALL' && item.source !== activeSource) return false;
            if (selectedKam.length > 0) {
                const itemKam = item.kam || "Unassigned";
                if (!selectedKam.includes(itemKam)) return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesCandidate = item.candidateName.toLowerCase().includes(query);
                const matchesCompany = item.company.toLowerCase().includes(query);
                if (!matchesCandidate && !matchesCompany) return false;
            }
            return true;
        });

        // Base for View Toggles: respects Source + KAM + Search
        const viewBase = baseActionables.filter(item => {
            if (activeSource !== 'ALL' && item.source !== activeSource) return false;
            if (selectedKam.length > 0) {
                const itemKam = item.kam || "Unassigned";
                if (!selectedKam.includes(itemKam)) return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!item.candidateName.toLowerCase().includes(query) &&
                    !item.company.toLowerCase().includes(query)) return false;
            }
            return true;
        });

        // Base for Source Toggles: respects View + KAM + Search
        const sourceBase = baseActionables.filter(item => {
            if (activeView === 'NEW' && !isNewItem(item)) return false;
            if (selectedKam.length > 0) {
                const itemKam = item.kam || "Unassigned";
                if (!selectedKam.includes(itemKam)) return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!item.candidateName.toLowerCase().includes(query) &&
                    !item.company.toLowerCase().includes(query)) return false;
            }
            return true;
        });

        return {
            total: kpiBase.length,
            critical: kpiBase.filter(i => i.pendingDays >= 45).length,
            attention: kpiBase.filter(i => i.pendingDays >= 30 && i.pendingDays < 45).length,
            normal: kpiBase.filter(i => i.pendingDays < 30).length,
            viewCounts: {
                ALL: viewBase.length,
                NEW: viewBase.filter(isNewItem).length
            },
            sourceCounts: {
                ALL: sourceBase.length,
                POST_TBR: sourceBase.filter(i => i.source === 'POST_TBR').length,
                IC: sourceBase.filter(i => i.source === 'IC').length
            }
        };
    }, [baseActionables, activeSource, activeView, selectedKam, searchQuery, handledIds]);

    useEffect(() => {
        refreshData();
    }, []);

    // Derived state for KAM leaderboard (respects source, search, AND activeView but NOT selectedKam)
    const kamLeaderboard = React.useMemo(() => {
        const counts: Record<string, number> = {};

        viewFilteredItems.forEach(item => {
            const kamName = item.kam || "Unassigned";
            counts[kamName] = (counts[kamName] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [viewFilteredItems]);

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
            updateLocalItem,
            markAsHandled,
            kamLeaderboard,
            searchQuery,
            setSearchQuery,
            stats
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
