/**
 * Devices Page Component
 * Full device management view with list and grid layouts
 */

import React, { useState } from 'react';
import './Pages.css';

function DevicesPage({ devices, selectedDevice, onSelectDevice }) {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [filterType, setFilterType] = useState('all'); // 'all', 'pir', 'gas'

    // Filter devices by type
    const filteredDevices = devices.filter(device => {
        if (filterType === 'all') return true;
        return device.sensor_type === filterType;
    });

    // Get device counts
    const counts = {
        total: devices.length,
        pir: devices.filter(d => d.sensor_type === 'pir').length,
        gas: devices.filter(d => d.sensor_type === 'gas').length,
        threat: devices.filter(d => d.state === 'threat').length,
        normal: devices.filter(d => d.state === 'normal').length
    };

    return (
        <div className="page devices-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">📡</span>
                    Device Management
                </h1>
                <p className="page-subtitle">Monitor and manage all connected IoT devices</p>
            </div>

            {/* Device Stats */}
            <div className="device-stats-bar">
                <div className="stat-chip">
                    <span className="chip-icon">📊</span>
                    <span className="chip-value">{counts.total}</span>
                    <span className="chip-label">Total</span>
                </div>
                <div className="stat-chip pir">
                    <span className="chip-icon">👁️</span>
                    <span className="chip-value">{counts.pir}</span>
                    <span className="chip-label">PIR</span>
                </div>
                <div className="stat-chip gas">
                    <span className="chip-icon">💨</span>
                    <span className="chip-value">{counts.gas}</span>
                    <span className="chip-label">Gas</span>
                </div>
                <div className="stat-chip normal">
                    <span className="chip-icon">✓</span>
                    <span className="chip-value">{counts.normal}</span>
                    <span className="chip-label">Normal</span>
                </div>
                <div className="stat-chip threat">
                    <span className="chip-icon">⚠️</span>
                    <span className="chip-value">{counts.threat}</span>
                    <span className="chip-label">Threat</span>
                </div>
            </div>

            {/* Controls */}
            <div className="device-controls">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All Devices
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'pir' ? 'active' : ''}`}
                        onClick={() => setFilterType('pir')}
                    >
                        👁️ PIR Sensors
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'gas' ? 'active' : ''}`}
                        onClick={() => setFilterType('gas')}
                    >
                        💨 Gas Sensors
                    </button>
                </div>
                <div className="view-buttons">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        ⊞ Grid
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        ☰ List
                    </button>
                </div>
            </div>

            {/* No Devices */}
            {filteredDevices.length === 0 ? (
                <div className="empty-card">
                    <span className="empty-icon">🔌</span>
                    <h3>No Devices Found</h3>
                    <p>
                        {filterType === 'all'
                            ? 'Waiting for IoT devices to send data...'
                            : `No ${filterType.toUpperCase()} sensors connected`
                        }
                    </p>
                </div>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="devices-table">
                    <div className="table-header">
                        <span className="th-status">Status</span>
                        <span className="th-device">Device ID</span>
                        <span className="th-type">Type</span>
                        <span className="th-value">Current Value</span>
                        <span className="th-state">State</span>
                        <span className="th-lastseen">Last Seen</span>
                    </div>
                    {filteredDevices.map(device => (
                        <div
                            key={device.id}
                            className={`table-row ${device.state === 'threat' ? 'threat' : ''} ${selectedDevice === device.id ? 'selected' : ''}`}
                            onClick={() => onSelectDevice(device.id)}
                        >
                            <span className="td-status">
                                <span className={`status-dot ${device.state}`}></span>
                            </span>
                            <span className="td-device">
                                <strong>{device.id}</strong>
                            </span>
                            <span className="td-type">
                                <span className={`type-badge ${device.sensor_type}`}>
                                    {device.sensor_type === 'pir' ? '👁️ PIR' :
                                        device.sensor_type === 'gas' ? '💨 Gas' : '📊 Sensor'}
                                </span>
                            </span>
                            <span className="td-value">
                                {device.sensor_type === 'pir' ? (
                                    <span className={device.motion_detected ? 'value-danger' : 'value-success'}>
                                        {device.motion_detected ? '🚨 MOTION' : '✓ Clear'}
                                    </span>
                                ) : device.sensor_type === 'gas' ? (
                                    <span className={device.is_high ? 'value-danger' : ''}>
                                        {device.gas_level || 0} ppm
                                    </span>
                                ) : (
                                    <span>
                                        {device.temperature?.toFixed(1) || '--'}°C / {device.humidity?.toFixed(1) || '--'}%
                                    </span>
                                )}
                            </span>
                            <span className="td-state">
                                <span className={`state-badge ${device.state}`}>
                                    {device.state === 'threat' ? '⚠️ Threat' : '✓ Normal'}
                                </span>
                            </span>
                            <span className="td-lastseen">
                                {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                /* Grid View */
                <div className="devices-grid">
                    {filteredDevices.map(device => (
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
                                    <div className="stat-item full-width">
                                        <span className="stat-icon">👁️</span>
                                        <span className="stat-label">Motion</span>
                                        <span className={`stat-value ${device.motion_detected ? 'danger' : 'success'}`}>
                                            {device.motion_detected ? '🚨 DETECTED' : '✓ Clear'}
                                        </span>
                                    </div>
                                ) : device.sensor_type === 'gas' ? (
                                    <div className="stat-item full-width">
                                        <span className="stat-icon">💨</span>
                                        <span className="stat-label">Gas Level</span>
                                        <span className={`stat-value ${device.is_high ? 'danger' : ''}`}>
                                            {device.gas_level || 0} ppm
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
                                    Last: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
                                </span>
                                <span className={`state-badge ${device.state}`}>
                                    {device.state === 'threat' ? '⚠️ Threat' : '✓ Normal'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DevicesPage;
