'use client';

export default function DebugPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const nodeEnv = process.env.NODE_ENV;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
            <h1 className="text-3xl font-bold mb-8">Environment Check</h1>

            <div className="space-y-4 font-mono text-sm">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <span className="text-gray-400">NEXT_PUBLIC_API_URL:</span>
                    <br />
                    <span className={apiUrl ? 'text-green-400' : 'text-red-400'}>
                        {apiUrl || '(undefined)'}
                    </span>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <span className="text-gray-400">NODE_ENV:</span>
                    <br />
                    <span className="text-blue-400">
                        {nodeEnv || '(undefined)'}
                    </span>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <span className="text-gray-400">Timestamp:</span>
                    <br />
                    <span className="text-yellow-400">
                        {new Date().toISOString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
