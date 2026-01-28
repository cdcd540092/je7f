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
      
      // Auto-select if not selected and devices exist
      if (!selectedDeviceId && videoDevices.length > 0) {
        // Try to find one that looks like an external USB camera first
        const external = videoDevices.find(d => d.label.toLowerCase().includes('usb') || d.label.toLowerCase().includes('external'));
        onSelect(external ? external.deviceId : videoDevices[0].deviceId);
      }

    } catch (err) {
      console.error("Error enumerating devices", err);
      setPermissionGranted(false);
    }
  };

  useEffect(() => {
    getDevices();
    
    // Listen for device changes (plugging in the glasses)
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
        Camera permission required to detect Smart Glasses.
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">
        Video Input Source
      </label>
      <div className="relative">
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-300 py-3 px-4 pr-8 rounded appearance-none focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <i className="fas fa-chevron-down text-xs"></i>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        <i className="fas fa-info-circle mr-1"></i>
        Connect glasses via USB-C. Ensure Android "OTG" is enabled.
      </p>
    </div>
  );
};

export default CameraSelector;