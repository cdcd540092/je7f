export interface VideoDevice {
  deviceId: string;
  label: string;
}

export interface AnalysisResult {
  text: string;
  timestamp: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}