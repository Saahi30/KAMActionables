import React, { useState } from 'react';
import { RefreshCw, BarChart3, Inbox, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import type { KamStat } from '../../types';

interface SidebarProps {
    activeSource: string;
    onSourceChange: (source: string) => void;
    activeView: 'ALL' | 'NEW';
    onViewChange: (view: 'ALL' | 'NEW') => void;
    selectedKam: string[];
    kams: KamStat[];
    onKamChange: (kam: string) => void;
    onRefresh: () => void;
    stats: {
        viewCounts: { ALL: number; NEW: number };
        sourceCounts: { ALL: number; POST_TBR: number; IC: number };
    };
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSource,
    onSourceChange,
    activeView,
    onViewChange,
    selectedKam,
    kams,
    onKamChange,
    onRefresh,
    stats
}) => {
    const [isKamListCollapsed, setIsKamListCollapsed] = useState(false);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <BarChart3 className="icon" />
                    <span>KAM Actionables</span>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section">
                    <h3>Views</h3>
                    <div className="view-toggles">
                        <button
                            className={`view-btn ${activeView === 'NEW' ? 'active' : ''}`}
                            onClick={() => onViewChange('NEW')}
                        >
                            <div className="view-btn-content">
                                <Inbox size={16} />
                                <span>New</span>
                                <span className="count-badge">{stats.viewCounts.NEW}</span>
                            </div>
                        </button>
                        <button
                            className={`view-btn ${activeView === 'ALL' ? 'active' : ''}`}
                            onClick={() => onViewChange('ALL')}
                        >
                            <div className="view-btn-content">
                                <Eye size={16} />
                                <span>All</span>
                                <span className="count-badge">{stats.viewCounts.ALL}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="sidebar-section">
                    <h3>Source</h3>
                    <nav className="nav-menu">
                        <div className="source-toggles">
                            <button
                                className={`source-btn ${activeSource === 'ALL' ? 'active' : ''}`}
                                onClick={() => onSourceChange('ALL')}
                            >
                                <div className="source-btn-content">
                                    <span>All</span>
                                    <span className="source-count">{stats.sourceCounts.ALL}</span>
                                </div>
                            </button>
                            <button
                                className={`source-btn ${activeSource === 'POST_TBR' ? 'active' : ''}`}
                                onClick={() => onSourceChange('POST_TBR')}
                            >
                                <div className="source-btn-content">
                                    <span>Post-TBR</span>
                                    <span className="source-count">{stats.sourceCounts.POST_TBR}</span>
                                </div>
                            </button>
                            <button
                                className={`source-btn ${activeSource === 'IC' ? 'active' : ''}`}
                                onClick={() => onSourceChange('IC')}
                            >
                                <div className="source-btn-content">
                                    <span>IC</span>
                                    <span className="source-count">{stats.sourceCounts.IC}</span>
                                </div>
                            </button>
                        </div>
                    </nav>
                </div>

                <div className="sidebar-section">
                    <div className="section-header clickable" onClick={() => setIsKamListCollapsed(!isKamListCollapsed)}>
                        <div className="header-title-group">
                            <h3>KAM List</h3>
                            {isKamListCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </div>
                    </div>
                    {!isKamListCollapsed && (
                        <div className="kam-list">
                            <div className={`kam-item-chip ${selectedKam.length === 0 ? 'active' : ''}`} onClick={() => onKamChange('ALL')}>
                                <span className="kam-name">All KAMs</span>
                                <span className="kam-count-total">{kams.reduce((sum, k) => sum + k.count, 0)}</span>
                            </div>
                            {kams.map((kam) => (
                                <div
                                    key={kam.name}
                                    className={`kam-item-chip ${selectedKam.includes(kam.name) ? 'active' : ''}`}
                                    onClick={() => onKamChange(kam.name)}
                                >
                                    <span className="kam-name">{kam.name || "Unassigned"}</span>
                                    <span className="kam-count-badge">{kam.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar-footer">
                <button className="refresh-btn" onClick={onRefresh}>
                    <RefreshCw size={16} />
                    Refresh Data
                </button>
            </div>

            <style>{`
        .sidebar {
            width: 260px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--bg-card);
            display: flex;
            flex-direction: column;
            height: 100vh;
            color: var(--text-secondary);
        }
        .sidebar-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--bg-card);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--text-primary);
            font-weight: 600;
            font-size: 1.1rem;
        }
        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            padding: 0.5rem 0;
        }
        .sidebar-content::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-content::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-content::-webkit-scrollbar-thumb {
            background: var(--bg-card);
            border-radius: 10px;
        }
        .sidebar-content::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
        .sidebar-section {
            padding: 0.15rem 1.5rem;
            flex: 0 0 auto;
        }
        .sidebar-section h3 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.3rem;
            color: var(--text-secondary);
            opacity: 0.7;
        }
        .view-toggles {
            display: flex;
            gap: 4px;
            margin-bottom: 0.4rem;
            background: rgba(255, 255, 255, 0.03);
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--bg-card);
        }
        .view-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 0.5rem 0.25rem;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        .view-btn:hover {
            background: var(--bg-overlay);
            color: var(--text-primary);
        }
        .view-btn.active {
            background: var(--bg-card);
            color: var(--text-primary);
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .view-btn-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
        }
        .view-count {
            font-size: 0.75rem;
            background: var(--bg-secondary);
            padding: 1px 6px;
            border-radius: 10px;
            min-width: 20px;
            text-align: center;
            border: 1px solid var(--bg-card);
        }
        .view-btn.active .view-count {
            background: var(--accent-primary);
            color: white;
            border-color: var(--accent-primary);
        }
        .view-count.has-new {
            color: var(--warning);
            font-weight: 700;
        }
        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .source-toggles {
            display: flex;
            gap: 4px;
            background: rgba(255, 255, 255, 0.03);
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--bg-card);
        }
        .source-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 0.5rem 0.2rem;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            font-size: 0.75rem;
            font-weight: 500;
            white-space: nowrap;
        }
        .source-btn:hover {
            background: var(--bg-overlay);
            color: var(--text-primary);
        }
        .source-btn.active {
            background: var(--accent-primary);
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .source-btn-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }
        .source-count {
            font-size: 0.65rem;
            opacity: 0.8;
            font-weight: 400;
        }
        .count-badge {
            background: var(--bg-card);
            padding: 1px 6px;
            border-radius: 10px;
            font-size: 0.7rem;
            min-width: 20px;
            text-align: center;
        }
        .view-btn.active .count-badge {
            background: white;
            color: var(--accent-primary);
        }
        .nav-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            font-family: inherit;
            font-size: 0.9rem;
        }
        .nav-item:hover {
            background: var(--bg-overlay);
            color: var(--text-primary);
        }
        .nav-item.active {
            background: var(--accent-primary);
            color: white;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .section-header.clickable {
            cursor: pointer;
            padding: 4px 0;
            user-select: none;
            transition: opacity 0.2s;
        }
        .section-header.clickable:hover {
            opacity: 0.8;
        }
        .header-title-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
        }
        .header-title-group h3 {
            margin-bottom: 0; /* Align with icon */
        }
        .kam-list {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            padding: 0.4rem;
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid var(--bg-card);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        .kam-list::-webkit-scrollbar {
            width: 4px;
        }
        .kam-list::-webkit-scrollbar-track {
            background: transparent;
        }
        .kam-list::-webkit-scrollbar-thumb {
            background: var(--bg-card);
            border-radius: 10px;
        }
        .kam-list::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
        .kam-item-chip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            background: transparent;
            border: 1px solid transparent;
            font-size: 0.82rem;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text-secondary);
            user-select: none;
        }
        .kam-item-chip:hover {
            background: var(--bg-overlay);
            border-color: var(--text-secondary);
            color: var(--text-primary);
        }
        .kam-item-chip.active {
            background: rgba(59, 130, 246, 0.08);
            border-color: var(--accent-primary);
            color: var(--accent-primary);
            font-weight: 600;
        }
        .kam-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .kam-count-badge {
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            min-width: 24px;
            text-align: center;
        }
        .kam-item-chip.active .kam-count-badge {
            background: var(--accent-primary);
            color: white;
        }
        .kam-count-total {
            font-size: 0.75rem;
            opacity: 0.6;
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--bg-card);
        }
        .refresh-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: var(--bg-card);
            border: 1px solid var(--bg-overlay);
            color: var(--text-primary);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
        }
        .refresh-btn:hover {
            background: var(--bg-secondary);
            border-color: var(--text-secondary);
        }
      `}</style>
        </aside>
    );
};

export default Sidebar;
