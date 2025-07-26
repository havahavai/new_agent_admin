import React, { useState, useEffect } from 'react';
import { apiCallMonitor } from '../utils/apiCallMonitor';

/**
 * Development-only component to monitor API calls
 * Shows a floating widget with API call statistics
 */
const ApiCallMonitor: React.FC = () => {
  const [stats, setStats] = useState({ activeCalls: 0, totalCalls: 0, recentDuplicates: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(apiCallMonitor.getStats());
    };

    // Update stats every second
    const interval = setInterval(updateStats, 1000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle API Monitor"
      >
        📡
      </button>

      {/* Monitor widget */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-64">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">API Monitor</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Active Calls:</span>
              <span className={stats.activeCalls > 0 ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                {stats.activeCalls}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Total Calls:</span>
              <span className="text-gray-600">{stats.totalCalls}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Recent Duplicates:</span>
              <span className={stats.recentDuplicates > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                {stats.recentDuplicates}
              </span>
            </div>

            {stats.recentDuplicates > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ Duplicate API calls detected! Check console for details.
              </div>
            )}

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• Green = Good</div>
                  <div>• Orange = Active calls</div>
                  <div>• Red = Duplicates detected</div>
                </div>
                
                <button
                  onClick={() => {
                    console.clear();
                    console.log('🧹 Console cleared');
                  }}
                  className="mt-2 w-full text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  Clear Console
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ApiCallMonitor;
