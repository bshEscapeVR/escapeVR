'use client';
import React, { useState } from 'react';

export default function DebugPage() {
    const [result, setResult] = useState('Waiting...');
    
    const testConnection = async () => {
        try {
            // פניה ישירה לשרת (ללא axios)
            const res = await fetch('https://escapevr-server.onrender.com/v1/settings');
            const data = await res.json();
            setResult('SUCCESS: ' + JSON.stringify(data).slice(0, 100));
        } catch (err) {
            setResult('ERROR: ' + err.message);
        }
    };

    return (
        <div className="p-10 text-white">
            <h1>Direct Connection Test</h1>
            <button 
                onClick={testConnection}
                className="bg-blue-500 p-2 rounded mt-4"
            >
                Test Fetch
            </button>
            <pre className="mt-4 bg-gray-800 p-4 rounded">{result}</pre>
        </div>
    );
}