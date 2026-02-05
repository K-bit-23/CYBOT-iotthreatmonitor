/**
 * NetworkStats Component
 * Displays network speed and traffic information
 */

import React, { useState, useEffect } from 'react';
import './NetworkStats.css';

function NetworkStats() {
    const [networkInfo, setNetworkInfo] = useState({
        downlink: 0,
        uplink: 0,
        effectiveType: '4g',
        rtt: 0,
        saveData: false,
        online: navigator.onLine
    });

    const [traffic, setTraffic] = useState({
        bytesReceived: 0,
        bytesSent: 0,
        packetsIn: 0,
        packetsOut: 0
    });

    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Get Network Information API if available
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const updateNetworkInfo = () => {
            if (connection) {
                setNetworkInfo({
                    downlink: connection.downlink || 0,
                    uplink: connection.uplink || 0,
                    effectiveType: connection.effectiveType || '4g',
                    rtt: connection.rtt || 0,
                    saveData: connection.saveData || false,
                    online: navigator.onLine
                });
            }
        };

        // Initial update
        updateNetworkInfo();

        // Listen for connection changes
        if (connection) {
            connection.addEventListener('change', updateNetworkInfo);
        }

        // Listen for online/offline events
        const handleOnline = () => setNetworkInfo(prev => ({ ...prev, online: true }));
        const handleOffline = () => setNetworkInfo(prev => ({ ...prev, online: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Simulate traffic monitoring (in real app, this would come from backend)
        const trafficInterval = setInterval(() => {
            setTraffic(prev => {
                const newReceived = prev.bytesReceived + Math.floor(Math.random() * 50000) + 10000;
                const newSent = prev.bytesSent + Math.floor(Math.random() * 20000) + 5000;

                // Update history for chart
                setHistory(h => {
                    const newHistory = [...h, {
                        time: Date.now(),
                        download: Math.floor(Math.random() * 100) + 20,
                        upload: Math.floor(Math.random() * 50) + 10
                    }];
                    return newHistory.slice(-20); // Keep last 20 points
                });

                return {
                    bytesReceived: newReceived,
                    bytesSent: newSent,
                    packetsIn: prev.packetsIn + Math.floor(Math.random() * 100) + 50,
                    packetsOut: prev.packetsOut + Math.floor(Math.random() * 50) + 25
                };
            });
        }, 2000);

        return () => {
            if (connection) {
                connection.removeEventListener('change', updateNetworkInfo);
            }
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(trafficInterval);
        };
    }, []);

    // Format bytes to human readable
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get speed class for styling
    const getSpeedClass = (speed) => {
        if (speed >= 10) return 'excellent';
        if (speed >= 5) return 'good';
        if (speed >= 1) return 'fair';
        return 'poor';
    };

    // Get connection type icon
    const getConnectionIcon = (type) => {
        switch (type) {
            case '4g': return '📶';
            case '3g': return '📱';
            case '2g': return '📞';
            case 'slow-2g': return '🐌';
            default: return '🌐';
        }
    };

    return (
        <div className="network-stats">
            <div className="network-header">
                <h3 className="network-title">
                    <span className="icon">🌐</span>
                    Network Monitor
                </h3>
                <span className={`connection-status ${networkInfo.online ? 'online' : 'offline'}`}>
                    {networkInfo.online ? '● Online' : '○ Offline'}
                </span>
            </div>

            {/* Speed Cards */}
            <div className="speed-cards">
                <div className={`speed-card download ${getSpeedClass(networkInfo.downlink)}`}>
                    <div className="speed-icon">⬇️</div>
                    <div className="speed-info">
                        <span className="speed-label">Download</span>
                        <span className="speed-value">
                            {networkInfo.downlink.toFixed(1)}
                            <small>Mbps</small>
                        </span>
                    </div>
                    <div className="speed-bar">
                        <div
                            className="speed-fill"
                            style={{ width: `${Math.min(networkInfo.downlink * 5, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className={`speed-card upload ${getSpeedClass(networkInfo.uplink || networkInfo.downlink * 0.3)}`}>
                    <div className="speed-icon">⬆️</div>
                    <div className="speed-info">
                        <span className="speed-label">Upload</span>
                        <span className="speed-value">
                            {(networkInfo.uplink || networkInfo.downlink * 0.3).toFixed(1)}
                            <small>Mbps</small>
                        </span>
                    </div>
                    <div className="speed-bar">
                        <div
                            className="speed-fill upload-fill"
                            style={{ width: `${Math.min((networkInfo.uplink || networkInfo.downlink * 0.3) * 10, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Network Info */}
            <div className="network-info-grid">
                <div className="info-item">
                    <span className="info-icon">{getConnectionIcon(networkInfo.effectiveType)}</span>
                    <span className="info-label">Type</span>
                    <span className="info-value">{networkInfo.effectiveType.toUpperCase()}</span>
                </div>
                <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span className="info-label">Latency</span>
                    <span className="info-value">{networkInfo.rtt} ms</span>
                </div>
                <div className="info-item">
                    <span className="info-icon">📥</span>
                    <span className="info-label">Received</span>
                    <span className="info-value">{formatBytes(traffic.bytesReceived)}</span>
                </div>
                <div className="info-item">
                    <span className="info-icon">📤</span>
                    <span className="info-label">Sent</span>
                    <span className="info-value">{formatBytes(traffic.bytesSent)}</span>
                </div>
            </div>

            {/* Traffic Chart */}
            <div className="traffic-chart">
                <h4 className="chart-title">Traffic History</h4>
                <div className="chart-container">
                    <div className="chart-bars">
                        {history.map((point, index) => (
                            <div key={index} className="traffic-bar-group">
                                <div
                                    className="traffic-bar download-bar"
                                    style={{ height: `${point.download}%` }}
                                    title={`↓ ${point.download} Mbps`}
                                ></div>
                                <div
                                    className="traffic-bar upload-bar"
                                    style={{ height: `${point.upload}%` }}
                                    title={`↑ ${point.upload} Mbps`}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="chart-legend">
                    <span className="legend-item">
                        <span className="legend-dot download"></span> Download
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot upload"></span> Upload
                    </span>
                </div>
            </div>

            {/* Packet Stats */}
            <div className="packet-stats">
                <div className="packet-item">
                    <span className="packet-label">Packets In</span>
                    <span className="packet-value">{traffic.packetsIn.toLocaleString()}</span>
                </div>
                <div className="packet-item">
                    <span className="packet-label">Packets Out</span>
                    <span className="packet-value">{traffic.packetsOut.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

export default NetworkStats;
