import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

const KPISection: React.FC = () => {
    const { stats, timelineFilter, setTimelineFilter } = useDashboard();

    const cards = [
        { id: 'ALL', label: 'Total Pending', value: stats.total, color: 'var(--text-primary)', bg: 'var(--bg-card)' },
        { id: '45_PLUS', label: 'Critical (45+ Days)', value: stats.critical, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
        { id: '30_PLUS', label: 'Attention (30+ Days)', value: stats.attention, color: 'var(--warning)', bg: 'rgba(250, 204, 21, 0.1)' },
        { id: '10_PLUS', label: 'Normal (10+ Days)', value: stats.normal, color: 'var(--success)', bg: 'rgba(6, 78, 59, 0.1)' },
    ];

    return (
        <div className="kpi-grid">
            {cards.map(card => (
                <div
                    key={card.id}
                    className={`kpi-card ${timelineFilter === card.id ? 'active' : ''}`}
                    onClick={() => setTimelineFilter(card.id as any)}
                    style={{ borderColor: timelineFilter === card.id ? card.color : 'transparent' }}
                >
                    <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
                    <div className="kpi-label">{card.label}</div>
                    <div className="kpi-bg" style={{ background: card.bg }}></div>
                </div>
            ))}

            <style>{`
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .kpi-card {
                    position: relative;
                    background: var(--bg-secondary);
                    border: 1px solid var(--bg-card);
                    border-radius: 12px;
                    padding: 0.6rem 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    overflow: hidden;
                    min-height: 85px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .kpi-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.1);
                }
                .kpi-card.active {
                    background: var(--bg-card);
                }
                .kpi-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.1rem;
                    position: relative;
                    z-index: 1;
                    line-height: 0.9;
                    letter-spacing: -0.02em;
                }
                .kpi-label {
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    font-weight: 600;
                    position: relative;
                    z-index: 1;
                    white-space: nowrap;
                }
                .kpi-bg {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 30%;
                    filter: blur(40px);
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
};

export default KPISection;
