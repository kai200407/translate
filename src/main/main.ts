import { app, BrowserWindow, ipcMain, clipboard, screen, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isAlwaysOnTop = true;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

function createWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 700,
        height: 450,
        x: screenWidth - 720,
        y: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: isAlwaysOnTop,
        skipTaskbar: false,
        resizable: true,
        minimizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        { label: '显示/隐藏', click: () => mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() },
        {
            label: '置顶', type: 'checkbox', checked: isAlwaysOnTop, click: (item) => {
                isAlwaysOnTop = item.checked;
                mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
            }
        },
        { type: 'separator' },
        { label: '退出', click: () => app.quit() }
    ]);

    tray.setToolTip('翻译贴板');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow?.show());
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    globalShortcut.register('CommandOrControl+Shift+T', () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow?.show();
            mainWindow?.focus();
        }
    });

    globalShortcut.register('CommandOrControl+Shift+C', () => {
        const text = clipboard.readText();
        if (text && mainWindow) {
            mainWindow.webContents.send('clipboard-text', text);
            mainWindow.show();
        }
    });
});

ipcMain.handle('get-clipboard-text', () => clipboard.readText());
ipcMain.handle('get-clipboard-image', () => {
    const image = clipboard.readImage();
    if (image.isEmpty()) return null;
    return image.toDataURL();
});
ipcMain.handle('set-always-on-top', (_, value: boolean) => {
    isAlwaysOnTop = value;
    mainWindow?.setAlwaysOnTop(value);
});
ipcMain.handle('minimize-window', () => mainWindow?.minimize());
ipcMain.handle('close-window', () => mainWindow?.hide());
ipcMain.handle('set-opacity', (_, value: number) => mainWindow?.setOpacity(value));

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
