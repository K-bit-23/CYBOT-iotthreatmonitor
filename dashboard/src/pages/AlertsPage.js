/**
 * Alerts Page Component
 * Full alerts management view
 */

import React from 'react';
import './Pages.css';

function AlertsPage({ alerts }) {
    const acknowledgeAlert = (alertId) => {
        console.log('Acknowledging alert:', alertId);
        // TODO: Implement acknowledge in Firebase
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': return '🔴';
            case 'medium': return '🟠';
            case 'low': return '🟡';
            default: return '⚪';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'motion': return '👁️';
            case 'gas': return '💨';
            case 'temperature': return '🌡️';
            case 'anomaly': return '⚠️';
            default: return '📊';
        }
    };

    return (
        <div className="page alerts-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">🚨</span>
                    Threat Alerts
                </h1>
                <p className="page-subtitle">
                    {alerts.filter(a => !a.acknowledged).length} active alerts
                </p>
            </div>

            <div className="alerts-container">
                {alerts.length === 0 ? (
                    <div className="empty-card">
                        <span className="empty-icon">✅</span>
                        <h3>No Alerts</h3>
                        <p>All systems operating normally</p>
                    </div>
                ) : (
                    <div className="alerts-list-full">
                        {alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`alert-full-card ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}
                            >
                                <div className="alert-header">
                                    <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
                                    <span className="type-icon">{getTypeIcon(alert.type)}</span>
                                    <div className="alert-info">
                                        <h3 className="alert-title">
                                            {alert.type === 'motion' ? 'Motion Detected' :
                                                alert.type === 'gas' ? 'High Gas Level' :
                                                    'Anomaly Detected'}
                                        </h3>
                                        <span className="alert-device">Device: {alert.device_id}</span>
                                    </div>
                                    <span className="alert-time">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                <div className="alert-body">
                                    <p className="alert-message">{alert.message}</p>

                                    <div className="alert-details">
                                        {alert.temperature && (
                                            <span className="detail-item">🌡️ {alert.temperature}°C</span>
                                        )}
                                        {alert.humidity && (
                                            <span className="detail-item">💧 {alert.humidity}%</span>
                                        )}
                                        {alert.gas_level && (
                                            <span className="detail-item">💨 {alert.gas_level}</span>
                                        )}
                                        {alert.pir_motion !== undefined && (
                                            <span className="detail-item">👁️ PIR: {alert.pir_motion}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="alert-actions">
                                    {!alert.acknowledged && (
                                        <button
                                            className="btn-acknowledge"
                                            onClick={() => acknowledgeAlert(alert.id)}
                                        >
                                            ✓ Acknowledge
                                        </button>
                                    )}
                                    <button className="btn-details">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AlertsPage;
