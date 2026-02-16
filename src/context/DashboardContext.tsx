import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ActionableItem } from '../types';
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
    allKams: string[];
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

            // 3. Cleanup completedIds
            // If an ID is in our local "completed" set but NOT in the fresh fetch, 
            // it means the backend View has effectively filtered it out. We can stop tracking it locally.
            setCompletedIds(prev => {
                const next = new Set(prev);
                const fetchedIds = new Set(allItems.map(i => i.id));
                let changed = false;
                next.forEach(id => {
                    if (!fetchedIds.has(id)) {
                        next.delete(id);
                        changed = true;
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

    // Memoized filtered actionables
    const actionables = React.useMemo(() => {
        return rawActionables.filter(item => {
            // Priority 1: Check if it's in our local "just completed" set
            if (completedIds.has(item.id)) return false;

            // Priority 2: Check if the Airtable data already has the completed marker
            const notes = item.displayNotes || "";
            return !notes.match(/\[COMPLETED:\s*\d{4}-\d{2}-\d{2}\]/);
        });
    }, [rawActionables, completedIds]);

    useEffect(() => {
        refreshData();
    }, []);

    // Derived state for KAM list
    const allKams = Array.from(new Set(actionables.map(item => item.kam))).filter(Boolean).sort();

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
            allKams,
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
