import React, { useState, useEffect } from 'react';
import CameraSelector from './components/CameraSelector';
import SmartHUD from './components/SmartHUD';

const App: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);

  useEffect(() => {
    // Check for API key availability on mount
    if (process.env.API_KEY) {
      setApiKeySet(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-2 md:p-8 font-sans">
      
      {/* Header - Compact on mobile */}
      <header className="max-w-4xl mx-auto mb-4 md:mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-1 flex items-center">
            <i className="fas fa-glasses text-cyan-500 mr-2 md:mr-3"></i>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              UVC LINK
            </span>
          </h1>
          <p className="text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-widest">
            Smart Glass Interface // Android
          </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-[10px] text-cyan-500/50 font-mono">SYS.VER. 2.5.1</div>
           <div className="text-[10px] text-green-500/50 font-mono">
             API LINK: {apiKeySet ? 'ONLINE' : 'OFFLINE'}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto pb-12">
        
        {/* Connection Guide - Collapsible or Compact on Mobile */}
        <div className="mb-6 p-3 bg-slate-900/50 border-l-2 border-slate-700 rounded-r text-xs text-slate-400">
            <h4 className="text-slate-300 font-bold mb-1 flex items-center">
                <i className="fas fa-plug mr-2 text-[10px]"></i> 
                Android Connection
            </h4>
            <p>Connect glasses via USB-C. Ensure <strong>OTG</strong> is enabled in settings.</p>
        </div>

        <CameraSelector 
          selectedDeviceId={selectedDeviceId}
          onSelect={setSelectedDeviceId} 
        />

        <div className="mt-4 md:mt-8">
           <SmartHUD deviceId={selectedDeviceId} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-8 pt-6 border-t border-slate-900 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] font-mono">
        <div>
           &copy; {new Date().getFullYear()} JJSdk Web Bridge.
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-4">
           <span><i className="fas fa-mobile-alt mr-1"></i> MOBILE OPTIMIZED</span>
           <span><i className="fas fa-battery-three-quarters mr-1"></i> PWR OPTIMAL</span>
        </div>
      </footer>
    </div>
  );
};

export default App;