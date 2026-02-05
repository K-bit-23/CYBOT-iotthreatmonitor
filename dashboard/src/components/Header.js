/**
 * Header Component
 * Navigation bar with branding and connection status
 */

import React from 'react';
import './Header.css';

function Header({ connectionStatus, alertCount }) {
    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'var(--status-normal)';
            case 'connecting': return 'var(--status-warning)';
            case 'disconnected': return 'var(--status-danger)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                {/* Logo & Brand */}
                <div className="brand">
                    <div className="logo">
                        <span className="logo-icon">🛡️</span>
                    </div>
                    <div className="brand-text">
                        <h1 className="brand-name">IoT Threat Monitor</h1>
                        <span className="brand-tagline">Anomaly Detection System</span>
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="header-actions">
                    {/* Connection Status */}
                    <div className="status-indicator">
                        <span
                            className="status-dot"
                            style={{ backgroundColor: getStatusColor() }}
                        ></span>
                        <span className="status-text">
                            {connectionStatus === 'connected' ? 'Live' : connectionStatus}
                        </span>
                    </div>

                    {/* Alert Bell */}
                    <button className="alert-button">
                        <span className="bell-icon">🔔</span>
                        {alertCount > 0 && (
                            <span className="notification-badge">{alertCount}</span>
                        )}
                    </button>

                    {/* Time */}
                    <div className="current-time">
                        <CurrentTime />
                    </div>
                </div>
            </div>
        </header>
    );
}

// Live clock component
function CurrentTime() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <span className="time-display">
            {time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}
        </span>
    );
}

export default Header;
