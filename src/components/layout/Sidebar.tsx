import React from 'react';
import { LayoutDashboard, Users, Filter, RefreshCw, BarChart3 } from 'lucide-react';

interface SidebarProps {
    activeSource: string;
    onSourceChange: (source: string) => void;
    selectedKam: string[];
    kams: string[];
    onKamChange: (kam: string) => void;
    onRefresh: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeSource,
    onSourceChange,
    selectedKam,
    kams,
    onKamChange,
    onRefresh
}) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <BarChart3 className="icon" />
                    <span>KAM Actionables</span>
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
                <div className="section-header">
                    <h3>KAM Filter</h3>
                    <Filter size={14} />
                </div>
                <div className="kam-list">
                    <div className={`kam-item-chip ${selectedKam.length === 0 ? 'active' : ''}`} onClick={() => onKamChange('ALL')}>
                        <span>All KAMs</span>
                    </div>
                    {kams.map(kam => (
                        <div
                            key={kam}
                            className={`kam-item-chip ${selectedKam.includes(kam) ? 'active' : ''}`}
                            onClick={() => onKamChange(kam)}
                        >
                            <span>{kam || "Unassigned"}</span>
                        </div>
                    ))}
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
        .sidebar-section {
            padding: 0.5rem 1.5rem;
            flex: 0 0 auto;
        }
        .sidebar-section:nth-of-type(2) {
            flex: 1;
            overflow-y: auto;
        }
        .sidebar-section h3 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            opacity: 0.7;
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
        .kam-list {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        .kam-item-chip {
            display: flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
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
            background: rgba(59, 130, 246, 0.05); /* Very light tint */
            border-color: var(--accent-primary);
            color: var(--accent-primary);
            font-weight: 600;
        }
        [data-theme='light'] .kam-item-chip.active {
            background: rgba(37, 99, 235, 0.05);
        }
        [data-theme='light'] .kam-item-chip {
            background: rgba(0, 0, 0, 0.01);
        }
        .sidebar-footer {
            padding: 1.5rem;
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
