'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await api.get('/test');
      setResult({ success: true, data: response.data });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        details: error.response?.data || error.request || 'No response from server',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
        <button
          onClick={testConnection}
          disabled={loading}
          className="btn-primary mb-6"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>

        {result && (
          <div className={`card p-6 ${result.success ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
            <h2 className="text-xl font-bold mb-4">
              {result.success ? '✅ Connection Successful!' : '❌ Connection Failed'}
            </h2>
            <pre className="bg-foreground/90 text-emerald-400 p-4 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 card p-6">
          <h3 className="font-bold mb-2">API Configuration:</h3>
          <p className="text-sm text-muted-foreground">
            Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api'}
          </p>
        </div>
      </div>
    </div>
  );
}


