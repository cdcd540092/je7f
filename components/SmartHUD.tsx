import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeFrame } from '../services/geminiService';
import { ConnectionStatus } from '../types';

interface SmartHUDProps {
  deviceId: string | null;
}

const SmartHUD: React.FC<SmartHUDProps> = ({ deviceId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>("--:--");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [needsUserAction, setNeedsUserAction] = useState(false);

  // Initialize Camera Stream
  useEffect(() => {
    if (!deviceId) return;

    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const startStream = async () => {
      setStatus(ConnectionStatus.SCANNING);
      setErrorMessage(null);
      setNeedsUserAction(false);
      setDebugInfo("Init...");
      
      try {
        // Stop previous tracks
        if (videoRef.current && videoRef.current.srcObject) {
           const oldStream = videoRef.current.srcObject as MediaStream;
           oldStream.getTracks().forEach(track => track.stop());
        }

        // --- CRITICAL FIX FOR ANDROID OTG ---
        // Force VGA (640x480). High resolutions (1080p) often cause "Black Screen" 
        // on mobile due to USB bandwidth or power limits on the OTG port.
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        };

        setDebugInfo("Requesting 640x480...");
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        currentStream = stream;

        // Log active resolution
        const track = stream.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings();
          setDebugInfo(`Active: ${settings.width}x${settings.height} | ${settings.frameRate}fps`);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Do NOT await play() here directly. Wait for user interaction if needed.
          // We rely on the "Tap to Start" button if autoplay fails.
          attemptPlay();
        }

      } catch (err: any) {
        console.error("Stream error:", err);
        setStatus(ConnectionStatus.ERROR);
        
        if (err.name === 'NotReadableError') {
          setErrorMessage("System Busy. Close other camera apps.");
        } else if (err.name === 'OverconstrainedError') {
          setErrorMessage("Resolution not supported.");
        } else if (err.name === 'NotAllowedError') {
          setErrorMessage("Permission Denied.");
        } else {
          setErrorMessage(`${err.name}: ${err.message}`);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  const attemptPlay = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
      setStatus(ConnectionStatus.CONNECTED);
      setNeedsUserAction(false);
    } catch (err) {
      console.warn("Autoplay blocked, waiting for user gesture", err);
      setNeedsUserAction(true); // Show the start button
    }
  };

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    setAiResponse(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Safety check for video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        setAiResponse("Error: No video data (0x0 resolution)");
        setIsAnalyzing(false);
        return;
    }

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

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative group">
      
      {/* Container */}
      <div 
        ref={containerRef}
        className={`relative w-full aspect-video bg-black overflow-hidden rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] border border-slate-800 group-fullscreen:rounded-none`}
      >
        {/* Decorative HUD Borders */}
        {!isFullscreen && (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-500 z-20"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-500 z-20"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-500 z-20"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-500 z-20"></div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element: Always opacity-100 to avoid accidental hiding */}
        <video
          ref={videoRef}
          playsInline
          muted
          // Removed 'autoPlay' attribute to rely on manual/scripted play
          className="w-full h-full object-contain bg-black opacity-100"
        />

        {/* --- INTERACTION LAYERS --- */}

        {/* 1. START BUTTON (Autoplay Fix) */}
        {needsUserAction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <button 
              onClick={attemptPlay}
              className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse hover:animate-none transition-all"
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-play text-3xl mb-2"></i>
                <span className="tracking-widest uppercase text-xs">Tap to Start Feed</span>
              </div>
            </button>
          </div>
        )}

        {/* 2. ERROR OVERLAY */}
        {status === ConnectionStatus.ERROR && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 p-6 text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-red-400 font-bold mb-2">SIGNAL ERROR</h3>
              <p className="text-slate-400 text-xs font-mono mb-6 max-w-xs mx-auto border p-2 border-slate-800 bg-slate-900">{errorMessage || "Unknown Error"}</p>
              <button onClick={() => window.location.reload()} className="bg-slate-800 border border-slate-600 px-6 py-2 rounded text-xs uppercase hover:bg-slate-700 text-white">
                 Refresh System
              </button>
           </div>
        )}

        {/* 3. LOADING SPINNER */}
        {status === ConnectionStatus.SCANNING && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-black/40">
             <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* 4. HUD OVERLAYS */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
          <div className="flex items-center space-x-3 pointer-events-auto">
            <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur px-3 py-1 rounded border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] md:text-xs font-mono text-cyan-400 uppercase tracking-wider">{status}</span>
            </div>
            {/* Debug Info visible on mobile now */}
            <div className="text-[9px] font-mono text-slate-500 bg-black/50 px-2 py-1 rounded border border-slate-800">
               {debugInfo}
            </div>
          </div>
          <button onClick={toggleFullscreen} className="pointer-events-auto text-cyan-400 bg-slate-900/50 p-2 rounded backdrop-blur border border-cyan-500/30">
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* AI Result Overlay */}
        {(aiResponse || isAnalyzing) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-slate-900/90 to-transparent pt-12 pb-6 px-4 z-40">
             <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-cyan-400 text-xs font-bold font-mono uppercase tracking-widest flex items-center">
                      <i className="fas fa-microchip mr-2"></i> VISION CORE
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">{lastAnalysisTime}</span>
                </div>
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2 text-slate-300 text-sm font-mono animate-pulse">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                    <span>Processing visual feed...</span>
                  </div>
                ) : (
                  <p className="text-slate-200 text-sm leading-relaxed font-light">{aiResponse}</p>
                )}
             </div>
          </div>
        )}

      </div>

      {/* Control Deck */}
      <div className="mt-4 md:mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="hidden md:block text-xs text-slate-500 font-mono">STATUS: OPTIMAL</div>
         <button
           onClick={handleCaptureAndAnalyze}
           disabled={status !== ConnectionStatus.CONNECTED || isAnalyzing}
           className={`
             w-full md:w-auto px-8 py-4 md:py-3 rounded-md font-bold text-sm tracking-wider uppercase
             transition-all duration-300 shadow-lg relative overflow-hidden group
             ${status === ConnectionStatus.CONNECTED 
               ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40' 
               : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
           `}
         >
           <span className="relative z-10 flex items-center justify-center">
             <i className="fas fa-eye mr-2"></i> Analyze Scene
           </span>
         </button>
      </div>
    </div>
  );
};

export default SmartHUD;