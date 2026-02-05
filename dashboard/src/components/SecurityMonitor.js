/**
 * Security Monitor Component
 * Tracks abnormal traffic, unauthorized access attempts, and sensor alerts
 */

import React, { useState, useEffect } from 'react';
import './SecurityMonitor.css';

function SecurityMonitor({ alerts, devices }) {
    const [securityStats, setSecurityStats] = useState({
        totalAttempts: 0,
        blockedAttempts: 0,
        abnormalTraffic: 0,
        pirAlerts: 0,
        gasAlerts: 0,
        threatLevel: 'low' // low, medium, high, critical
    });

    const [accessAttempts, setAccessAttempts] = useState([]);
    const [trafficData, setTrafficData] = useState([]);

    // Simulate unauthorized access attempts detection
    useEffect(() => {
        // Generate simulated access attempts based on sensor data
        const generateAttempts = () => {
            const attemptTypes = [
                { type: 'port_scan', description: 'Port Scanning Detected', severity: 'medium' },
                { type: 'brute_force', description: 'Brute Force Attack', severity: 'high' },
                { type: 'unknown_device', description: 'Unknown Device Connection', severity: 'medium' },
                { type: 'suspicious_payload', description: 'Suspicious MQTT Payload', severity: 'high' },
                { type: 'rate_limit', description: 'Rate Limit Exceeded', severity: 'low' },
                { type: 'auth_failed', description: 'Authentication Failed', severity: 'medium' }
            ];

            // Generate based on current alerts
            const pirAlerts = alerts.filter(a => a.type === 'motion').length;
            const gasAlerts = alerts.filter(a => a.type === 'gas').length;

            const newAttempts = [];

            // Motion detection can trigger security alerts
            if (pirAlerts > 0) {
                newAttempts.push({
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toISOString(),
                    sourceIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    type: 'motion_breach',
                    description: '🚨 Physical Intrusion Detected (PIR)',
                    severity: 'critical',
                    status: 'active',
                    sensor: 'IR/PIR'
                });
            }

            // High gas can indicate tampering
            if (gasAlerts > 0) {
                newAttempts.push({
                    id: Date.now() + Math.random() + 1,
                    timestamp: new Date().toISOString(),
                    sourceIP: 'Environment',
                    type: 'gas_anomaly',
                    description: '💨 Environmental Anomaly (Gas)',
                    severity: 'high',
                    status: 'active',
                    sensor: 'Gas'
                });
            }

            // Simulate random network attempts
            if (Math.random() > 0.7) {
                const randomAttempt = attemptTypes[Math.floor(Math.random() * attemptTypes.length)];
                newAttempts.push({
                    id: Date.now() + Math.random() + 2,
                    timestamp: new Date().toISOString(),
                    sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    ...randomAttempt,
                    status: Math.random() > 0.3 ? 'blocked' : 'active',
                    sensor: 'Network'
                });
            }

            if (newAttempts.length > 0) {
                setAccessAttempts(prev => [...newAttempts, ...prev].slice(0, 20));
            }
        };

        const interval = setInterval(generateAttempts, 5000);
        generateAttempts(); // Initial run

        return () => clearInterval(interval);
    }, [alerts]);

    // Calculate security statistics
    useEffect(() => {
        const pirCount = alerts.filter(a => a.type === 'motion').length;
        const gasCount = alerts.filter(a => a.type === 'gas').length;
        const blocked = accessAttempts.filter(a => a.status === 'blocked').length;
        const active = accessAttempts.filter(a => a.status === 'active').length;

        // Calculate threat level
        let threatLevel = 'low';
        if (active > 5 || pirCount > 2 || gasCount > 2) {
            threatLevel = 'critical';
        } else if (active > 2 || pirCount > 0 || gasCount > 1) {
            threatLevel = 'high';
        } else if (active > 0 || gasCount > 0) {
            threatLevel = 'medium';
        }

        setSecurityStats({
            totalAttempts: accessAttempts.length,
            blockedAttempts: blocked,
            abnormalTraffic: Math.floor(Math.random() * 15) + active * 3,
            pirAlerts: pirCount,
            gasAlerts: gasCount,
            threatLevel
        });
    }, [alerts, accessAttempts]);

    // Generate traffic data
    useEffect(() => {
        const generateTraffic = () => {
            const now = Date.now();
            const newData = [];
            for (let i = 9; i >= 0; i--) {
                newData.push({
                    time: new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    normal: Math.floor(Math.random() * 50) + 30,
                    abnormal: Math.floor(Math.random() * 10) + (securityStats.threatLevel === 'critical' ? 15 : securityStats.threatLevel === 'high' ? 8 : 2)
                });
            }
            setTrafficData(newData);
        };

        generateTraffic();
        const interval = setInterval(generateTraffic, 30000);
        return () => clearInterval(interval);
    }, [securityStats.threatLevel]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#ff4757';
            case 'high': return '#ff6b6b';
            case 'medium': return '#ffa502';
            case 'low': return '#2ed573';
            default: return '#a4b0be';
        }
    };

    return (
        <div className="security-monitor">
            {/* Threat Level Banner */}
            <div className={`threat-banner ${securityStats.threatLevel}`}>
                <div className="threat-indicator">
                    <span className="threat-icon">
                        {securityStats.threatLevel === 'critical' ? '🔴' :
                            securityStats.threatLevel === 'high' ? '🟠' :
                                securityStats.threatLevel === 'medium' ? '🟡' : '🟢'}
                    </span>
                    <div className="threat-info">
                        <span className="threat-label">THREAT LEVEL</span>
                        <span className="threat-value">{securityStats.threatLevel.toUpperCase()}</span>
                    </div>
                </div>
                <div className="threat-stats">
                    <div className="threat-stat">
                        <span className="stat-val">{securityStats.totalAttempts}</span>
                        <span className="stat-lbl">Total Attempts</span>
                    </div>
                    <div className="threat-stat blocked">
                        <span className="stat-val">{securityStats.blockedAttempts}</span>
                        <span className="stat-lbl">Blocked</span>
                    </div>
                    <div className="threat-stat abnormal">
                        <span className="stat-val">{securityStats.abnormalTraffic}</span>
                        <span className="stat-lbl">Abnormal</span>
                    </div>
                </div>
            </div>

            {/* Sensor Alerts Summary */}
            <div className="sensor-alerts-summary">
                <div className="sensor-alert-card pir">
                    <span className="alert-icon">👁️</span>
                    <div className="alert-details">
                        <span className="alert-type">IR/PIR Sensor</span>
                        <span className="alert-count">{securityStats.pirAlerts} alerts</span>
                    </div>
                    <span className={`status-badge ${securityStats.pirAlerts > 0 ? 'danger' : 'safe'}`}>
                        {securityStats.pirAlerts > 0 ? 'INTRUSION' : 'CLEAR'}
                    </span>
                </div>
                <div className="sensor-alert-card gas">
                    <span className="alert-icon">💨</span>
                    <div className="alert-details">
                        <span className="alert-type">Gas Sensor</span>
                        <span className="alert-count">{securityStats.gasAlerts} alerts</span>
                    </div>
                    <span className={`status-badge ${securityStats.gasAlerts > 0 ? 'warning' : 'safe'}`}>
                        {securityStats.gasAlerts > 0 ? 'ANOMALY' : 'NORMAL'}
                    </span>
                </div>
            </div>

            {/* Traffic Chart */}
            <div className="traffic-section">
                <h3 className="section-title">
                    <span className="icon">📊</span>
                    Network Traffic Analysis
                </h3>
                <div className="traffic-chart">
                    <div className="chart-bars">
                        {trafficData.map((data, index) => (
                            <div key={index} className="bar-group">
                                <div className="bar-container">
                                    <div
                                        className="bar normal"
                                        style={{ height: `${data.normal}%` }}
                                        title={`Normal: ${data.normal}`}
                                    ></div>
                                    <div
                                        className="bar abnormal"
                                        style={{ height: `${data.abnormal * 3}%` }}
                                        title={`Abnormal: ${data.abnormal}`}
                                    ></div>
                                </div>
                                <span className="bar-label">{data.time}</span>
                            </div>
                        ))}
                    </div>
                    <div className="chart-legend">
                        <span className="legend-item"><span className="dot normal"></span> Normal Traffic</span>
                        <span className="legend-item"><span className="dot abnormal"></span> Abnormal Traffic</span>
                    </div>
                </div>
            </div>

            {/* Unauthorized Access Attempts */}
            <div className="access-attempts-section">
                <h3 className="section-title">
                    <span className="icon">🚫</span>
                    Unauthorized Access Attempts
                    {accessAttempts.filter(a => a.status === 'active').length > 0 && (
                        <span className="active-badge">{accessAttempts.filter(a => a.status === 'active').length} Active</span>
                    )}
                </h3>
                <div className="attempts-list">
                    {accessAttempts.length === 0 ? (
                        <div className="no-attempts">
                            <span className="icon">✅</span>
                            <p>No unauthorized access attempts detected</p>
                        </div>
                    ) : (
                        accessAttempts.map((attempt) => (
                            <div
                                key={attempt.id}
                                className={`attempt-card ${attempt.severity} ${attempt.status}`}
                            >
                                <div className="attempt-indicator" style={{ backgroundColor: getSeverityColor(attempt.severity) }}></div>
                                <div className="attempt-icon">
                                    {attempt.sensor === 'IR/PIR' ? '👁️' :
                                        attempt.sensor === 'Gas' ? '💨' : '🌐'}
                                </div>
                                <div className="attempt-info">
                                    <span className="attempt-desc">{attempt.description}</span>
                                    <span className="attempt-meta">
                                        <span className="source">{attempt.sourceIP}</span>
                                        <span className="sensor">{attempt.sensor}</span>
                                        <span className="time">{new Date(attempt.timestamp).toLocaleTimeString()}</span>
                                    </span>
                                </div>
                                <span className={`attempt-status ${attempt.status}`}>
                                    {attempt.status === 'blocked' ? '🛡️ Blocked' : '⚠️ Active'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default SecurityMonitor;
