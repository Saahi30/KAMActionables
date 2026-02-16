import { Search, Bell, Sun, Moon, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useDashboard } from '../../context/DashboardContext';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { theme, toggleTheme } = useTheme();
    const { searchQuery, setSearchQuery } = useDashboard();

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="page-title">{title}</h1>
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="header-actions">
                <button className="icon-btn theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="icon-btn">
                    <Bell size={20} />
                </button>
            </div>

            <style>{`
                .header {
                    height: 70px;
                    border-bottom: 1px solid var(--bg-card);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 2rem;
                    background: var(--bg-primary);
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 3rem; /* Push search bar to the left but away from title */
                }
                .page-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                    color: var(--text-primary);
                    white-space: nowrap;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .search-bar {
                    position: relative;
                    width: 300px;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }
                .search-bar input {
                    width: 100%;
                    padding: 0.6rem 1rem 0.6rem 2.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-card);
                    border-radius: 20px;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .search-bar input:focus {
                    border-color: var(--accent-primary);
                    background: var(--bg-card);
                }
                .clear-search {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 50%;
                }
                .clear-search:hover {
                    color: var(--text-primary);
                    background: var(--bg-card);
                }
                .icon-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .icon-btn:hover {
                    background: var(--bg-card);
                    color: var(--text-primary);
                }
                .theme-toggle {
                    background: var(--bg-card);
                    color: var(--warning);
                    border: 1px solid var(--bg-overlay);
                }
                .theme-toggle:hover {
                    transform: scale(1.1) rotate(10deg);
                    background: var(--bg-overlay);
                }
                }
            `}</style>
        </header>
    );
};

export default Header;
