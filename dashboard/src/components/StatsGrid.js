/**
 * StatsGrid Component
 * Displays key metrics in a grid layout
 */

import React from 'react';
import './StatsGrid.css';

function StatsGrid({ stats }) {
    const statCards = [
        {
            id: 'total',
            label: 'Total Devices',
            value: stats.totalDevices,
            icon: '📡',
            color: 'var(--accent-primary)'
        },
        {
            id: 'normal',
            label: 'Normal Status',
            value: stats.normalDevices,
            icon: '✅',
            color: 'var(--status-normal)'
        },
        {
            id: 'threat',
            label: 'Threat Detected',
            value: stats.threatDevices,
            icon: '⚠️',
            color: 'var(--status-danger)'
        },
        {
            id: 'alerts',
            label: 'Active Alerts',
            value: stats.activeAlerts,
            icon: '🔔',
            color: 'var(--status-warning)'
        }
    ];

    return (
        <div className="stats-grid">
            {statCards.map((stat, index) => (
                <div
                    key={stat.id}
                    className="stat-card"
                    style={{
                        '--accent': stat.color,
                        animationDelay: `${index * 0.1}s`
                    }}
                >
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-content">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </div>
                    <div className="stat-glow"></div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;
