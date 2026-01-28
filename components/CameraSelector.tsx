import React, { useEffect, useState } from 'react';
import { VideoDevice } from '../types';

interface CameraSelectorProps {
  onSelect: (deviceId: string) => void;
  selectedDeviceId: string | null;
}

const CameraSelector: React.FC<CameraSelectorProps> = ({ onSelect, selectedDeviceId }) => {
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const getDevices = async () => {
    try {
      // Must request permission first to get labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
        }));
      
      setDevices(videoDevices);
      
      // Auto-select logic if not already selected
      if (!selectedDeviceId && videoDevices.length > 0) {
        const external = videoDevices.find(d => 
          d.label.toLowerCase().includes('usb') || 
          d.label.toLowerCase().includes('external') ||
          d.label.toLowerCase().includes('uvc')
        );
        onSelect(external ? external.deviceId : videoDevices[0].deviceId);
      }

    } catch (err) {
      console.error("Error enumerating devices", err);
      setPermissionGranted(false);
    }
  };

  useEffect(() => {
    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!permissionGranted) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-sm mb-4">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        Permission required. Please allow camera access.
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest">
          Video Input Source
        </label>
        <button 
          onClick={getDevices}
          className="text-[10px] text-cyan-500 hover:text-cyan-400 font-mono uppercase border border-cyan-500/30 px-2 py-1 rounded hover:bg-cyan-900/20 transition-colors"
        >
          <i className="fas fa-sync-alt mr-1"></i> Scan
        </button>
      </div>
      
      <div className="relative">
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-300 py-4 px-4 pr-8 rounded appearance-none focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors cursor-pointer"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <i className="fas fa-chevron-down text-xs"></i>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        <i className="fas fa-info-circle mr-1"></i>
        If screen is black, try selecting a different camera or re-plug glasses.
      </p>
    </div>
  );
};

export default CameraSelector;