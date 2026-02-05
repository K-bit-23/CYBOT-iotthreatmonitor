/**
 * Settings Page Component
 * System configuration and settings
 */

import React, { useState } from 'react';
import './Pages.css';

function SettingsPage() {
    const [settings, setSettings] = useState({
        mqttBroker: 'broker.hivemq.com',
        mqttPort: 1883,
        alertsEnabled: true,
        emailNotifications: false,
        pushNotifications: true,
        darkMode: true,
        refreshInterval: 5,
        gasThreshold: 500,
        tempHighThreshold: 40,
        tempLowThreshold: 10,
        humidityHighThreshold: 80,
        humidityLowThreshold: 20
    });

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        console.log('Saving settings:', settings);
        alert('Settings saved successfully!');
    };

    return (
        <div className="page settings-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-icon">⚙️</span>
                    Settings
                </h1>
                <p className="page-subtitle">Configure system settings and preferences</p>
            </div>

            <div className="settings-container">
                {/* MQTT Settings */}
                <div className="settings-section">
                    <h3 className="settings-section-title">
                        <span className="section-icon">📡</span>
                        MQTT Connection
                    </h3>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>Broker Address</label>
                            <input
                                type="text"
                                value={settings.mqttBroker}
                                onChange={(e) => handleChange('mqttBroker', e.target.value)}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Port</label>
                            <input
                                type="number"
                                value={settings.mqttPort}
                                onChange={(e) => handleChange('mqttPort', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="settings-section">
                    <h3 className="settings-section-title">
                        <span className="section-icon">🔔</span>
                        Notifications
                    </h3>
                    <div className="settings-grid">
                        <div className="setting-item toggle">
                            <label>Enable Alerts</label>
                            <button
                                className={`toggle-btn ${settings.alertsEnabled ? 'active' : ''}`}
                                onClick={() => handleChange('alertsEnabled', !settings.alertsEnabled)}
                            >
                                {settings.alertsEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div className="setting-item toggle">
                            <label>Email Notifications</label>
                            <button
                                className={`toggle-btn ${settings.emailNotifications ? 'active' : ''}`}
                                onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}
                            >
                                {settings.emailNotifications ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div className="setting-item toggle">
                            <label>Push Notifications</label>
                            <button
                                className={`toggle-btn ${settings.pushNotifications ? 'active' : ''}`}
                                onClick={() => handleChange('pushNotifications', !settings.pushNotifications)}
                            >
                                {settings.pushNotifications ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Threshold Settings */}
                <div className="settings-section">
                    <h3 className="settings-section-title">
                        <span className="section-icon">📊</span>
                        Alert Thresholds
                    </h3>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>Gas Threshold</label>
                            <input
                                type="number"
                                value={settings.gasThreshold}
                                onChange={(e) => handleChange('gasThreshold', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Temperature High (°C)</label>
                            <input
                                type="number"
                                value={settings.tempHighThreshold}
                                onChange={(e) => handleChange('tempHighThreshold', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Temperature Low (°C)</label>
                            <input
                                type="number"
                                value={settings.tempLowThreshold}
                                onChange={(e) => handleChange('tempLowThreshold', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Humidity High (%)</label>
                            <input
                                type="number"
                                value={settings.humidityHighThreshold}
                                onChange={(e) => handleChange('humidityHighThreshold', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="settings-section">
                    <h3 className="settings-section-title">
                        <span className="section-icon">🎨</span>
                        Display
                    </h3>
                    <div className="settings-grid">
                        <div className="setting-item toggle">
                            <label>Dark Mode</label>
                            <button
                                className={`toggle-btn ${settings.darkMode ? 'active' : ''}`}
                                onClick={() => handleChange('darkMode', !settings.darkMode)}
                            >
                                {settings.darkMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div className="setting-item">
                            <label>Refresh Interval (seconds)</label>
                            <input
                                type="number"
                                value={settings.refreshInterval}
                                onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="settings-actions">
                    <button className="btn-save" onClick={handleSave}>
                        💾 Save Settings
                    </button>
                    <button className="btn-reset" onClick={() => window.location.reload()}>
                        🔄 Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
