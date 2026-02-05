/**
 * ============================================================
 * Firebase Configuration for Dashboard
 * ============================================================
 * 
 * This file initializes Firebase for the frontend dashboard.
 * It uses the public Firebase config (NOT the service account).
 * 
 * The service account JSON should NEVER be used in frontend code!
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

// Firebase configuration for web app
// Get these values from Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",                    // Replace with your API key
    authDomain: "iotthreatmonitor.firebaseapp.com",
    databaseURL: "https://iotthreatmonitor-default-rtdb.firebaseio.com",
    projectId: "iotthreatmonitor",
    storageBucket: "iotthreatmonitor.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",       // Replace with your sender ID
    appId: "YOUR_APP_ID"                       // Replace with your app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Subscribe to device status updates in realtime
 * @param {Function} callback - Called when data changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDevices(callback) {
    const devicesRef = ref(database, 'devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const devices = Object.entries(data).map(([id, device]) => ({
                id,
                ...device.status,
                readings: device.readings ? Object.values(device.readings).slice(-10) : []
            }));
            callback(devices);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error('Firebase subscription error:', error);
        callback([]);
    });

    return unsubscribe;
}

/**
 * Subscribe to alerts in realtime
 * @param {Function} callback - Called when data changes
 * @param {number} limit - Max number of alerts to fetch
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAlerts(callback, limit = 20) {
    const alertsRef = ref(database, 'alerts');
    const alertsQuery = query(alertsRef, limitToLast(limit));

    const unsubscribe = onValue(alertsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const alerts = Object.entries(data)
                .map(([id, alert]) => ({ id, ...alert }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            callback(alerts);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error('Firebase alerts error:', error);
        callback([]);
    });

    return unsubscribe;
}

/**
 * Get latest reading for a specific device
 * @param {string} deviceId - Device ID
 * @param {Function} callback - Called with latest reading
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDeviceReadings(deviceId, callback) {
    const readingsRef = ref(database, `devices/${deviceId}/readings`);
    const readingsQuery = query(readingsRef, limitToLast(50));

    const unsubscribe = onValue(readingsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const readings = Object.values(data).sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );
            callback(readings);
        } else {
            callback([]);
        }
    });

    return unsubscribe;
}

export { database };
