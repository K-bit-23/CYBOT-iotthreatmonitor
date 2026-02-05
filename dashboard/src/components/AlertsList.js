/**
 * AlertsList Component
 * Displays threat alerts with details
 */

import React from 'react';
import './AlertsList.css';

function AlertsList({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="alerts-empty">
                <span className="empty-icon">🎉</span>
                <p>No alerts</p>
                <small>All systems operating normally</small>
            </div>
        );
    }

    return (
        <div className="alerts-list">
            {alerts.map((alert, index) => (
                <AlertItem key={alert.id} alert={alert} index={index} />
            ))}
        </div>
    );
}

function AlertItem({ alert, index }) {
    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'high': return 'severity-high';
            case 'medium': return 'severity-medium';
            case 'low': return 'severity-low';
            default: return 'severity-medium';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            className={`alert-item ${getSeverityClass(alert.severity)} ${alert.acknowledged ? 'acknowledged' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {/* Severity Badge */}
            <div className="alert-severity">
                {alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟠' : '🟡'}
            </div>

            {/* Alert Content */}
            <div className="alert-content">
                <div className="alert-header">
                    <span className="alert-device">{alert.device_id}</span>
                    <span className="alert-time">{formatTime(alert.timestamp)}</span>
                </div>

                <p className="alert-message">{alert.message || 'Anomaly detected'}</p>

                {/* Sensor Values */}
                <div className="alert-values">
                    <span className="alert-value">🌡️ {alert.temperature?.toFixed(1)}°C</span>
                    <span className="alert-value">💧 {alert.humidity?.toFixed(0)}%</span>
                    <span className="alert-value">💨 {alert.gas_level}</span>
                </div>

                {/* Reasons */}
                {alert.reasons && alert.reasons.length > 0 && (
                    <div className="alert-reasons">
                        {alert.reasons.map((reason, i) => (
                            <span key={i} className="reason-tag">{reason}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Acknowledged Badge */}
            {alert.acknowledged && (
                <span className="acknowledged-badge">✓</span>
            )}
        </div>
    );
}

export default AlertsList;
