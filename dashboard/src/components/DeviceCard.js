/**
 * DeviceCard Component
 * Displays individual device status
 */

import React from 'react';
import './DeviceCard.css';

function DeviceCard({ device, isSelected, onClick }) {
    const isThreat = device.state === 'threat';

    // Calculate time since last seen
    const getTimeSince = (timestamp) => {
        if (!timestamp) return 'Never';

        const now = new Date();
        const lastSeen = new Date(timestamp);
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    return (
        <div
            className={`device-card ${isSelected ? 'selected' : ''} ${isThreat ? 'threat' : 'normal'}`}
            onClick={onClick}
        >
            {/* Status Indicator */}
            <div className={`device-status-dot ${isThreat ? 'threat' : 'normal'}`}>
                {isThreat ? '⚠️' : '✓'}
            </div>

            {/* Device Info */}
            <div className="device-info">
                <span className="device-name">{device.id}</span>
                <span className="device-location">{device.location || 'Unknown Location'}</span>
            </div>

            {/* Quick Stats */}
            <div className="device-quick-stats">
                <span className="quick-stat" title="Temperature">
                    🌡️ {device.temperature?.toFixed(1) || '--'}°
                </span>
                <span className="quick-stat" title="Humidity">
                    💧 {device.humidity?.toFixed(0) || '--'}%
                </span>
            </div>

            {/* Last Seen */}
            <span className="device-last-seen">
                {getTimeSince(device.last_seen)}
            </span>
        </div>
    );
}

export default DeviceCard;
