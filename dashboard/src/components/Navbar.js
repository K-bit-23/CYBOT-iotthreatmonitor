/**
 * Navbar Component
 * Main navigation bar for the dashboard
 */

import React, { useState } from 'react';
import './Navbar.css';

function Navbar({ connectionStatus, alertCount, activeSection, onSectionChange }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'devices', label: 'Devices', icon: '📡' },
        { id: 'alerts', label: 'Alerts', icon: '🚨', badge: alertCount },
        { id: 'network', label: 'Network', icon: '🌐' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'var(--status-normal)';
            case 'connecting': return 'var(--status-warning)';
            case 'disconnected': return 'var(--status-danger)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo & Brand */}
                <div className="navbar-brand">
                    <div className="logo">
                        <span className="logo-icon">🛡️</span>
                    </div>
                    <div className="brand-text">
                        <h1 className="brand-name">CYBOT</h1>
                        <span className="brand-tagline">IoT Threat Monitor</span>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <ul className="navbar-nav">
                    {navItems.map(item => (
                        <li key={item.id} className="nav-item">
                            <button
                                className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => onSectionChange(item.id)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Right Side Actions */}
                <div className="navbar-actions">
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

                    {/* Notifications */}
                    <button className="action-btn notification-btn">
                        <span className="btn-icon">🔔</span>
                        {alertCount > 0 && (
                            <span className="action-badge">{alertCount}</span>
                        )}
                    </button>

                    {/* User Profile */}
                    <button className="action-btn profile-btn">
                        <span className="btn-icon">👤</span>
                    </button>

                    {/* Live Clock */}
                    <div className="live-clock">
                        <LiveClock />
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="hamburger">{isMobileMenuOpen ? '✕' : '☰'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                <ul className="mobile-nav-list">
                    {navItems.map(item => (
                        <li key={item.id} className="mobile-nav-item">
                            <button
                                className={`mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    onSectionChange(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}

// Live clock component
function LiveClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="clock-display">
            <span className="clock-time">
                {time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </span>
            <span className="clock-date">
                {time.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })}
            </span>
        </div>
    );
}

export default Navbar;
