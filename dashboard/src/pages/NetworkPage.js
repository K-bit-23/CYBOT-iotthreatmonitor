/**
 * Network Page Component
 * Full network monitoring view
 */

import React from 'react';
import './Pages.css';
import NetworkStats from '../components/NetworkStats';

function NetworkPage() {
    return (
        <div className="page network-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">🌐</span>
                    Network Monitoring
                </h1>
                <p className="page-subtitle">Real-time network speed and traffic analysis</p>
            </div>

            <div className="network-content">
                <NetworkStats />

                {/* Additional Network Info */}
                <div className="network-info-section">
                    <h3 className="section-title">MQTT Connection</h3>
                    <div className="info-grid">
                        <div className="info-card">
                            <span className="info-icon">📡</span>
                            <div className="info-details">
                                <span className="info-label">Broker</span>
                                <span className="info-value">broker.hivemq.com</span>
                            </div>
                        </div>
                        <div className="info-card">
                            <span className="info-icon">🔌</span>
                            <div className="info-details">
                                <span className="info-label">Port</span>
                                <span className="info-value">1883</span>
                            </div>
                        </div>
                        <div className="info-card">
                            <span className="info-icon">📨</span>
                            <div className="info-details">
                                <span className="info-label">Topics</span>
                                <span className="info-value">iot-cybot/pir/test, iot-cybot/gas/test</span>
                            </div>
                        </div>
                        <div className="info-card">
                            <span className="info-icon">🔒</span>
                            <div className="info-details">
                                <span className="info-label">Protocol</span>
                                <span className="info-value">MQTT v3.1.1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NetworkPage;
