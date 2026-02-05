/**
 * ============================================================
 * IoT Monitoring Dashboard - Main App Component
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import { subscribeToDevices, subscribeToAlerts } from './firebase';

// Components
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import DeviceCard from './components/DeviceCard';
import AlertsList from './components/AlertsList';
import SensorChart from './components/SensorChart';

function App() {
    // State
    const [devices, setDevices] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    // Subscribe to Firebase data on mount
    useEffect(() => {
        setIsLoading(true);

        // Subscribe to devices
        const unsubDevices = subscribeToDevices((data) => {
            setDevices(data);
            setIsLoading(false);
            setConnectionStatus('connected');

            // Auto-select first device if none selected
            if (!selectedDevice && data.length > 0) {
                setSelectedDevice(data[0].id);
            }
        });

        // Subscribe to alerts
        const unsubAlerts = subscribeToAlerts((data) => {
            setAlerts(data);
        });

        // Cleanup subscriptions
        return () => {
            unsubDevices();
            unsubAlerts();
        };
    }, []);

    // Calculate stats
    const stats = {
        totalDevices: devices.length,
        normalDevices: devices.filter(d => d.state === 'normal').length,
        threatDevices: devices.filter(d => d.state === 'threat').length,
        activeAlerts: alerts.filter(a => !a.acknowledged).length
    };

    // Get selected device data
    const selectedDeviceData = devices.find(d => d.id === selectedDevice);

    return (
        <div className="app">
            {/* Header */}
            <Header
                connectionStatus={connectionStatus}
                alertCount={stats.activeAlerts}
            />

            {/* Main Content */}
            <main className="main-content">
                {/* Stats Overview */}
                <section className="section">
                    <StatsGrid stats={stats} />
                </section>

                {/* Dashboard Grid */}
                <div className="dashboard-grid">
                    {/* Left Column - Devices */}
                    <section className="section devices-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="icon">📡</span>
                                Connected Devices
                            </h2>
                            <span className="device-count">{devices.length} devices</span>
                        </div>

                        <div className="devices-list">
                            {isLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Connecting to devices...</p>
                                </div>
                            ) : devices.length === 0 ? (
                                <div className="empty-state">
                                    <span className="icon">🔌</span>
                                    <p>No devices connected</p>
                                    <small>Waiting for IoT devices to send data...</small>
                                </div>
                            ) : (
                                devices.map(device => (
                                    <DeviceCard
                                        key={device.id}
                                        device={device}
                                        isSelected={selectedDevice === device.id}
                                        onClick={() => setSelectedDevice(device.id)}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Middle Column - Sensor Data */}
                    <section className="section sensor-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="icon">📊</span>
                                Live Sensor Data
                            </h2>
                            {selectedDeviceData && (
                                <span className="device-id">{selectedDevice}</span>
                            )}
                        </div>

                        {selectedDeviceData ? (
                            <div className="sensor-content">
                                {/* Current Values */}
                                <div className="current-values">
                                    <div className="value-card temperature">
                                        <span className="value-icon">🌡️</span>
                                        <div className="value-info">
                                            <span className="value-label">Temperature</span>
                                            <span className="value-number">
                                                {selectedDeviceData.temperature?.toFixed(1) || '--'}
                                                <small>°C</small>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="value-card humidity">
                                        <span className="value-icon">💧</span>
                                        <div className="value-info">
                                            <span className="value-label">Humidity</span>
                                            <span className="value-number">
                                                {selectedDeviceData.humidity?.toFixed(1) || '--'}
                                                <small>%</small>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="value-card gas">
                                        <span className="value-icon">💨</span>
                                        <div className="value-info">
                                            <span className="value-label">Gas Level</span>
                                            <span className="value-number">
                                                {selectedDeviceData.gas_level || '--'}
                                                <small>ppm</small>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart */}
                                <SensorChart
                                    readings={selectedDeviceData.readings || []}
                                    deviceId={selectedDevice}
                                />
                            </div>
                        ) : (
                            <div className="empty-state">
                                <span className="icon">📈</span>
                                <p>Select a device to view sensor data</p>
                            </div>
                        )}
                    </section>

                    {/* Right Column - Alerts */}
                    <section className="section alerts-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="icon">🚨</span>
                                Threat Alerts
                            </h2>
                            {stats.activeAlerts > 0 && (
                                <span className="alert-badge">{stats.activeAlerts} active</span>
                            )}
                        </div>

                        <AlertsList alerts={alerts} />
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>IoT Threat Monitor v1.0 | Powered by Isolation Forest ML</p>
            </footer>
        </div>
    );
}

export default App;
