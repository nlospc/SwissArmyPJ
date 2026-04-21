/**
 * Types for the preload-exposed Electron API
 */

export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
