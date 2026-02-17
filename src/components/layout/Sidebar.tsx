import React, { useState } from 'react';
import { LayoutDashboard, Users, RefreshCw, BarChart3, Inbox, Eye, ChevronDown, ChevronRight } from 'lucide-react';
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
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSource,
    onSourceChange,
    activeView,
    onViewChange,
    selectedKam,
    kams,
    onKamChange,
    onRefresh
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
                        </div>
                    </button>
                    <button
                        className={`view-btn ${activeView === 'ALL' ? 'active' : ''}`}
                        onClick={() => onViewChange('ALL')}
                    >
                        <div className="view-btn-content">
                            <Eye size={16} />
                            <span>All</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="sidebar-section">
                <h3>Source</h3>
                <nav className="nav-menu">
                    <button
                        className={`nav-item ${activeSource === 'ALL' ? 'active' : ''}`}
                        onClick={() => onSourceChange('ALL')}
                    >
                        <LayoutDashboard size={18} />
                        All Actionables
                    </button>
                    <button
                        className={`nav-item ${activeSource === 'POST_TBR' ? 'active' : ''}`}
                        onClick={() => onSourceChange('POST_TBR')}
                    >
                        <Users size={18} />
                        Post-TBR
                    </button>
                    <button
                        className={`nav-item ${activeSource === 'IC' ? 'active' : ''}`}
                        onClick={() => onSourceChange('IC')}
                    >
                        <Users size={18} />
                        IC Actionables
                    </button>
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
        .sidebar-section {
            padding: 0.5rem 1.5rem;
            flex: 0 0 auto;
        }
        .sidebar-section:nth-of-type(3) {
            flex: 1;
            overflow-y: auto;
            min-height: 0; /* Important for flex overflow */
        }
        .sidebar-section h3 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            opacity: 0.7;
        }
        .view-toggles {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            margin-bottom: 1rem;
        }
        .view-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
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
        }
        .view-btn-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
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
            gap: 0.25rem;
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
            gap: 0.4rem;
        }
        .kam-item-chip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--bg-card);
            font-size: 0.85rem;
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
