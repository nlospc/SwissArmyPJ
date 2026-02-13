import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electron', {
    invoke: async (channel, ...args) => {
        return await ipcRenderer.invoke(channel, ...args);
    },
});
