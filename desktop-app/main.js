const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const APP_URL = 'https://gestion-inventario-jet.vercel.app';

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Allegra — Gestión de Inventario',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false,
    });

    win.loadURL(APP_URL);

    win.once('ready-to-show', () => {
        win.show();
    });

    // Open external links in default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Simple menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'Allegra',
            submenu: [
                { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => win.reload() },
                { label: 'Inicio', click: () => win.loadURL(APP_URL) },
                { type: 'separator' },
                { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
            ],
        },
        {
            label: 'Ver',
            submenu: [
                { label: 'Pantalla completa', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
                { label: 'Zoom +', accelerator: 'CmdOrCtrl+=', click: () => win.webContents.setZoomFactor(win.webContents.getZoomFactor() + 0.1) },
                { label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: () => win.webContents.setZoomFactor(win.webContents.getZoomFactor() - 0.1) },
                { label: 'Zoom normal', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.setZoomFactor(1) },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
