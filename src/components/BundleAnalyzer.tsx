/**
 * Bundle Analyzer Component
 * 
 * Hiển thị thông tin về bundle size, lazy loaded modules, và performance
 * Chỉ hiện trong development mode
 */

import { useState, useEffect } from 'react';
import { ModuleRegistry } from '../core/ModuleRegistry';
import { useResourceTiming, getNavigationTiming, getSlowResources } from '../hooks/useResourceTiming';

export function BundleAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'resources' | 'timing'>('modules');
  const { timings, stats } = useResourceTiming(isOpen);
  const [modules, setModules] = useState<any[]>([]);
  
  // Update modules list
  useEffect(() => {
    if (!isOpen) return;
    
    const registry = ModuleRegistry.getInstance();
    const moduleList = registry.getAllModules();
    setModules(moduleList);
    
    const interval = setInterval(() => {
      const updated = registry.getAllModules();
      setModules(updated);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  // Keyboard shortcut: Ctrl+Shift+B
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors text-sm"
          title="Ctrl+Shift+B"
        >
          📊 Bundle
        </button>
      </div>
    );
  }
  
  const navTiming = getNavigationTiming();
  const slowResources = getSlowResources(500);
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[600px] max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="text-gray-900 dark:text-white">Bundle Analyzer</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === 'modules'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Modules
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === 'resources'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Resources
        </button>
        <button
          onClick={() => setActiveTab('timing')}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === 'timing'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Timing
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Modules</div>
                <div className="text-2xl text-gray-900 dark:text-white">{modules.length}</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Enabled</div>
                <div className="text-2xl text-green-900 dark:text-green-300">
                  {modules.filter(m => m.enabled).length}
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Routes</div>
                <div className="text-2xl text-blue-900 dark:text-blue-300">
                  {modules.reduce((sum, m) => sum + (m.routes?.length || 0), 0)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Lazy Loaded</div>
                <div className="text-2xl text-gray-900 dark:text-white">
                  {modules.length}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-900 dark:text-white mb-2">Registered Modules</h4>
              <div className="space-y-2">
                {modules.map(module => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {module.icon && <span className="text-gray-600 dark:text-gray-400">{module.icon}</span>}
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">{module.name}</div>
                        {module.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">{module.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {module.routes?.length || 0} routes
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        module.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {module.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">💡 Lazy Loading</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Module metadata loaded immediately, components lazy loaded on route visit.
                Check Resources tab to see actual bundle chunks loaded.
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Resources</div>
                <div className="text-2xl text-gray-900 dark:text-white">{stats.totalResources}</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Size</div>
                <div className="text-2xl text-blue-900 dark:text-blue-300">
                  {(stats.totalSize / 1024).toFixed(0)}KB
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Cached</div>
                <div className="text-2xl text-green-900 dark:text-green-300">{stats.cachedCount}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-900 dark:text-white mb-2">By Type</h4>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, data]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{type}</span>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>{data.count} files</span>
                      <span>{(data.size / 1024).toFixed(1)}KB</span>
                      <span>{data.duration.toFixed(0)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {slowResources.length > 0 && (
              <div>
                <h4 className="text-sm text-gray-900 dark:text-white mb-2">
                  ⚠️ Slow Resources (&gt;500ms)
                </h4>
                <div className="space-y-2">
                  {slowResources.slice(0, 5).map((resource, index) => (
                    <div
                      key={index}
                      className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                    >
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {resource.name.split('/').pop()}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>{resource.duration.toFixed(0)}ms</span>
                        <span>{(resource.size / 1024).toFixed(1)}KB</span>
                        {resource.cached && <span className="text-green-600">cached</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'timing' && navTiming && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">DNS Lookup</div>
                <div className="text-xl text-gray-900 dark:text-white">
                  {navTiming.dnsLookup.toFixed(2)}ms
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">TCP Connection</div>
                <div className="text-xl text-gray-900 dark:text-white">
                  {navTiming.tcpConnection.toFixed(2)}ms
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Request Time</div>
                <div className="text-xl text-blue-900 dark:text-blue-300">
                  {navTiming.requestTime.toFixed(2)}ms
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Response Time</div>
                <div className="text-xl text-blue-900 dark:text-blue-300">
                  {navTiming.responseTime.toFixed(2)}ms
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">DOM Interactive</div>
                <div className="text-xl text-green-900 dark:text-green-300">
                  {navTiming.domInteractive.toFixed(2)}ms
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">DOM Complete</div>
                <div className="text-xl text-green-900 dark:text-green-300">
                  {navTiming.domComplete.toFixed(2)}ms
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Load Time</div>
              <div className="text-3xl text-indigo-900 dark:text-indigo-300">
                {navTiming.totalTime.toFixed(2)}ms
              </div>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>DOM Content Loaded:</span>
                <span>{navTiming.domContentLoaded.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Redirect Time:</span>
                <span>{navTiming.redirectTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Time:</span>
                <span>{navTiming.cacheTime.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">Ctrl+Shift+B</kbd> to toggle
      </div>
    </div>
  );
}