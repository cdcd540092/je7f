import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeFrame } from '../services/geminiService';
import { ConnectionStatus } from '../types';

interface SmartHUDProps {
  deviceId: string | null;
}

const SmartHUD: React.FC<SmartHUDProps> = ({ deviceId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>("--:--");

  // Initialize Camera Stream
  useEffect(() => {
    if (!deviceId) return;

    const startStream = async () => {
      setStatus(ConnectionStatus.SCANNING);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus(ConnectionStatus.CONNECTED);
        }
      } catch (err) {
        console.error("Stream start error:", err);
        setStatus(ConnectionStatus.ERROR);
      }
    };

    startStream();

    return () => {
      // Cleanup stream on unmount or device switch
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    setAiResponse(null);

    // Draw video frame to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      try {
        const result = await analyzeFrame(base64Image);
        setAiResponse(result);
        const now = new Date();
        setLastAnalysisTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      } catch (e) {
        setAiResponse("Analysis failed. Check API configuration.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [isAnalyzing]);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative group">
      {/* Decorative HUD Borders */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-500 z-20"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-500 z-20"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-500 z-20"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-500 z-20"></div>

      {/* Main Viewport */}
      <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] border border-slate-800">
        
        {/* Hidden Canvas for Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${status === ConnectionStatus.CONNECTED ? 'opacity-100' : 'opacity-20'}`}
        />

        {/* Status Overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur px-3 py-1 rounded border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{status}</span>
          </div>
          {status === ConnectionStatus.CONNECTED && (
             <div className="text-[10px] font-mono text-slate-400 bg-black/50 px-2 py-1 rounded">
               UVC LINK ACTIVE
             </div>
          )}
        </div>

        {/* Grid Overlay (HUD Effect) */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Loading Spinner */}
        {status === ConnectionStatus.SCANNING && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
             <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* AI Analysis Overlay */}
        {(aiResponse || isAnalyzing) && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-cyan-400 text-xs font-bold font-mono uppercase tracking-widest flex items-center">
                  <i className="fas fa-microchip mr-2"></i>
                  Gemini Vision Core
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">{lastAnalysisTime}</span>
             </div>
             
             {isAnalyzing ? (
               <div className="flex items-center space-x-2 text-slate-300 text-sm font-mono">
                 <span className="inline-block w-2 h-2 bg-cyan-500 animate-ping rounded-full"></span>
                 <span>Analyzing visual data...</span>
               </div>
             ) : (
               <p className="text-slate-200 text-sm leading-relaxed font-light">
                 {aiResponse}
               </p>
             )}
          </div>
        )}

      </div>

      {/* Control Deck */}
      <div className="mt-6 flex justify-between items-center">
         <div className="text-xs text-slate-500 font-mono">
           <div className="mb-1">RES: 1080p | 60FPS</div>
           <div>LAT: 12ms</div>
         </div>

         <button
           onClick={handleCaptureAndAnalyze}
           disabled={status !== ConnectionStatus.CONNECTED || isAnalyzing}
           className={`
             relative overflow-hidden group px-8 py-3 rounded-md font-bold text-sm tracking-wider uppercase
             transition-all duration-300
             ${status === ConnectionStatus.CONNECTED 
               ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)]' 
               : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
           `}
         >
           <span className="relative z-10 flex items-center">
             <i className="fas fa-eye mr-2"></i>
             Analyze Scene
           </span>
           {/* Button Glitch Effect */}
           <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
         </button>
      </div>
    </div>
  );
};

export default SmartHUD;