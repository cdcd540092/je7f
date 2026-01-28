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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white mb-1 flex items-center">
            <i className="fas fa-glasses text-cyan-500 mr-3"></i>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              UVC LINK
            </span>
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Smart Glass Interface // WebRTC Bridge
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
      <main className="max-w-4xl mx-auto">
        
        {/* Connection Guide (Technical Context for User) */}
        <div className="mb-8 p-4 bg-slate-900/50 border-l-2 border-slate-700 rounded-r text-sm text-slate-400">
            <h4 className="text-slate-300 font-bold mb-2 flex items-center">
                <i className="fas fa-plug mr-2 text-xs"></i> 
                How to Connect
            </h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Connect smart glasses via USB-C to your Android device.</li>
                <li>Ensure <strong>OTG (On-The-Go)</strong> connection is enabled in Android Settings.</li>
                <li>The browser will treat the glasses as an external webcam (UVC).</li>
                <li>Select the USB camera from the list below.</li>
            </ul>
        </div>

        <CameraSelector 
          selectedDeviceId={selectedDeviceId}
          onSelect={setSelectedDeviceId} 
        />

        <div className="mt-8">
           <SmartHUD deviceId={selectedDeviceId} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-12 pt-6 border-t border-slate-900 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-mono">
        <div>
           &copy; {new Date().getFullYear()} JJSdk Web Bridge.
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-4">
           <span><i className="fas fa-wifi mr-1"></i> REMOTE</span>
           <span><i className="fas fa-battery-three-quarters mr-1"></i> PWR OPTIMAL</span>
        </div>
      </footer>
    </div>
  );
};

export default App;