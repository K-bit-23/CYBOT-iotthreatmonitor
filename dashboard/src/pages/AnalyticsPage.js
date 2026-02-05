/**
 * Analytics Page Component
 * Data visualization and analytics
 */

import React, { useState, useEffect } from 'react';
import './Pages.css';

function AnalyticsPage({ devices, alerts }) {
    const [stats, setStats] = useState({
        totalReadings: 0,
        totalAlerts: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        motionEvents: 0,
        gasEvents: 0
    });

    useEffect(() => {
        // Calculate statistics
        const motionAlerts = alerts.filter(a => a.type === 'motion').length;
        const gasAlerts = alerts.filter(a => a.type === 'gas').length;

        let tempSum = 0, humSum = 0, tempCount = 0;
        devices.forEach(d => {
            if (d.temperature) { tempSum += d.temperature; tempCount++; }
            if (d.humidity) { humSum += d.humidity; }
        });

        setStats({
            totalReadings: devices.length * 100, // Simulated
            totalAlerts: alerts.length,
            avgTemperature: tempCount > 0 ? tempSum / tempCount : 0,
            avgHumidity: tempCount > 0 ? humSum / tempCount : 0,
            motionEvents: motionAlerts,
            gasEvents: gasAlerts
        });
    }, [devices, alerts]);

    return (
        <div className="page analytics-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">📈</span>
                    Analytics Dashboard
                </h1>
                <p className="page-subtitle">Data insights and system analytics</p>
            </div>

            {/* Stats Overview */}
            <div className="analytics-grid">
                <div className="analytics-card">
                    <div className="analytics-icon">📊</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.totalReadings.toLocaleString()}</span>
                        <span className="analytics-label">Total Readings</span>
                    </div>
                </div>

                <div className="analytics-card warning">
                    <div className="analytics-icon">🚨</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.totalAlerts}</span>
                        <span className="analytics-label">Total Alerts</span>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-icon">🌡️</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.avgTemperature.toFixed(1)}°C</span>
                        <span className="analytics-label">Avg Temperature</span>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-icon">💧</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.avgHumidity.toFixed(1)}%</span>
                        <span className="analytics-label">Avg Humidity</span>
                    </div>
                </div>

                <div className="analytics-card danger">
                    <div className="analytics-icon">👁️</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.motionEvents}</span>
                        <span className="analytics-label">Motion Events</span>
                    </div>
                </div>

                <div className="analytics-card danger">
                    <div className="analytics-icon">💨</div>
                    <div className="analytics-info">
                        <span className="analytics-value">{stats.gasEvents}</span>
                        <span className="analytics-label">Gas Alerts</span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="charts-section">
                <div className="chart-card">
                    <h3 className="chart-title">Alert Distribution</h3>
                    <div className="chart-placeholder">
                        <div className="pie-chart">
                            <div className="pie-segment motion" style={{ '--percentage': `${stats.motionEvents * 20}deg` }}></div>
                            <div className="pie-segment gas" style={{ '--percentage': `${stats.gasEvents * 20}deg` }}></div>
                        </div>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot motion"></span> Motion ({stats.motionEvents})</span>
                            <span className="legend-item"><span className="dot gas"></span> Gas ({stats.gasEvents})</span>
                            <span className="legend-item"><span className="dot other"></span> Other ({stats.totalAlerts - stats.motionEvents - stats.gasEvents})</span>
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Device Status</h3>
                    <div className="status-bars">
                        <div className="status-bar">
                            <span className="bar-label">Online</span>
                            <div className="bar-track">
                                <div className="bar-fill online" style={{ width: `${devices.length > 0 ? 100 : 0}%` }}></div>
                            </div>
                            <span className="bar-value">{devices.length}</span>
                        </div>
                        <div className="status-bar">
                            <span className="bar-label">Threat</span>
                            <div className="bar-track">
                                <div className="bar-fill threat" style={{ width: `${devices.filter(d => d.state === 'threat').length * 10}%` }}></div>
                            </div>
                            <span className="bar-value">{devices.filter(d => d.state === 'threat').length}</span>
                        </div>
                        <div className="status-bar">
                            <span className="bar-label">Normal</span>
                            <div className="bar-track">
                                <div className="bar-fill normal" style={{ width: `${devices.filter(d => d.state === 'normal').length * 10}%` }}></div>
                            </div>
                            <span className="bar-value">{devices.filter(d => d.state === 'normal').length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
