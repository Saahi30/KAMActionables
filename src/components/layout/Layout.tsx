import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDashboard } from '../../context/DashboardContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const {
        activeSource,
        setActiveSource,
        activeView,
        setActiveView,
        selectedKam,
        setSelectedKam,
        kamLeaderboard,
        refreshData
    } = useDashboard();

    const handleKamChange = (kam: string) => {
        if (kam === 'ALL') {
            // If ALL is clicked, clear specific selections or reset
            setSelectedKam([]);
        } else {
            // Toggle logic
            if (selectedKam.includes(kam)) {
                setSelectedKam(selectedKam.filter(k => k !== kam));
            } else {
                setSelectedKam([...selectedKam, kam]);
            }
        }
    };

    return (
        <div className="app-layout">
            <Sidebar
                activeSource={activeSource}
                onSourceChange={setActiveSource}
                activeView={activeView}
                onViewChange={setActiveView}
                selectedKam={selectedKam}
                kams={kamLeaderboard}
                onKamChange={handleKamChange}
                onRefresh={refreshData}
            />
            <div className="main-content">
                <Header title={activeSource === 'ALL' ? 'All Actionables' : activeSource === 'POST_TBR' ? 'Post TBR' : 'IC Actionables'} />
                <main className="content-area">
                    {children}
                </main>
            </div>

            <style>{`
                .app-layout {
                    display: flex;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    background: var(--bg-primary);
                }
                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0; 
                }
                .content-area {
                    flex: 1;
                    overflow-x: auto;
                    overflow-y: hidden; /* Individual columns scroll */
                    padding: 2rem;
                }
            `}</style>
        </div>
    );
};

export default Layout;
