/**
 * SensorChart Component
 * Simple chart for sensor readings
 */

import React from 'react';
import './SensorChart.css';

function SensorChart({ readings, deviceId }) {
    if (!readings || readings.length === 0) {
        return (
            <div className="chart-empty">
                <p>No readings available</p>
            </div>
        );
    }

    // Get last 20 readings
    const data = readings.slice(-20);

    // Calculate min/max for scaling
    const temps = data.map(r => r.temperature || 0);
    const maxTemp = Math.max(...temps, 50);
    const minTemp = Math.min(...temps, 0);

    return (
        <div className="sensor-chart">
            <h3 className="chart-title">Temperature History</h3>

            <div className="chart-container">
                <div className="chart-bars">
                    {data.map((reading, index) => {
                        const height = ((reading.temperature - minTemp) / (maxTemp - minTemp)) * 100;
                        const isAnomaly = reading.is_anomaly;

                        return (
                            <div key={index} className="bar-wrapper">
                                <div
                                    className={`bar ${isAnomaly ? 'anomaly' : 'normal'}`}
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                    title={`${reading.temperature?.toFixed(1)}°C`}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="chart-labels">
                    <span>{maxTemp.toFixed(0)}°C</span>
                    <span>{((maxTemp + minTemp) / 2).toFixed(0)}°C</span>
                    <span>{minTemp.toFixed(0)}°C</span>
                </div>
            </div>

            <div className="chart-legend">
                <span className="legend-item normal">
                    <span className="legend-dot"></span> Normal
                </span>
                <span className="legend-item anomaly">
                    <span className="legend-dot"></span> Anomaly
                </span>
            </div>
        </div>
    );
}

export default SensorChart;
