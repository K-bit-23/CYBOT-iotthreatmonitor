/**
 * Devices Page Component
 * Full device management view
 */

import React from 'react';
import './Pages.css';

function DevicesPage({ devices, selectedDevice, onSelectDevice }) {
    return (
        <div className="page devices-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">📡</span>
                    Device Management
                </h1>
                <p className="page-subtitle">Monitor and manage all connected IoT devices</p>
            </div>

            <div className="devices-grid">
                {devices.length === 0 ? (
                    <div className="empty-card">
                        <span className="empty-icon">🔌</span>
                        <h3>No Devices Connected</h3>
                        <p>Waiting for IoT devices to send data...</p>
                    </div>
                ) : (
                    devices.map(device => (
                        <div
                            key={device.id}
                            className={`device-full-card ${device.state === 'threat' ? 'threat' : ''} ${selectedDevice === device.id ? 'selected' : ''}`}
                            onClick={() => onSelectDevice(device.id)}
                        >
                            <div className="device-header">
                                <span className={`status-indicator ${device.state}`}></span>
                                <h3 className="device-name">{device.id}</h3>
                                <span className="sensor-badge">{device.sensor_type || 'sensor'}</span>
                            </div>

                            <div className="device-stats">
                                {device.sensor_type === 'pir' ? (
                                    <div className="stat-item">
                                        <span className="stat-icon">👁️</span>
                                        <span className="stat-label">Motion</span>
                                        <span className={`stat-value ${device.motion_detected ? 'danger' : 'success'}`}>
                                            {device.motion_detected ? 'DETECTED' : 'Clear'}
                                        </span>
                                    </div>
                                ) : device.sensor_type === 'gas' ? (
                                    <div className="stat-item">
                                        <span className="stat-icon">💨</span>
                                        <span className="stat-label">Gas Level</span>
                                        <span className={`stat-value ${device.is_high ? 'danger' : 'normal'}`}>
                                            {device.gas_level || 0}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="stat-item">
                                            <span className="stat-icon">🌡️</span>
                                            <span className="stat-label">Temp</span>
                                            <span className="stat-value">{device.temperature?.toFixed(1) || '--'}°C</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-icon">💧</span>
                                            <span className="stat-label">Humidity</span>
                                            <span className="stat-value">{device.humidity?.toFixed(1) || '--'}%</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-icon">💨</span>
                                            <span className="stat-label">Gas</span>
                                            <span className="stat-value">{device.gas_level || '--'}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="device-footer">
                                <span className="last-seen">
                                    Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
                                </span>
                                <span className={`state-badge ${device.state}`}>
                                    {device.state === 'threat' ? '⚠️ Threat' : '✓ Normal'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default DevicesPage;
