export interface ElectronAPI {
    getClipboardText: () => Promise<string>;
    getClipboardImage: () => Promise<string | null>;
    setAlwaysOnTop: (value: boolean) => Promise<void>;
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    setOpacity: (value: number) => Promise<void>;
    onClipboardText: (callback: (text: string) => void) => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
