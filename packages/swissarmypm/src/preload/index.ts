import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  invoke: async (channel: string, ...args: any[]) => {
    return await ipcRenderer.invoke(channel, ...args);
  },
});
