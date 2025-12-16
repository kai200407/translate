import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    setOpacity: (value: number) => ipcRenderer.invoke('set-opacity', value),
    onClipboardText: (callback: (text: string) => void) => {
        ipcRenderer.on('clipboard-text', (_, text) => callback(text));
    },
});
