'use strict';

const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dotenv = require('dotenv');
const net = require('net');

// ── Prevent multiple instances ───────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

// ── Load .env.local ──────────────────────────────────────────────────────────
// Packaged: extraResources places .env.local directly in process.resourcesPath
// Dev: use local .env.local beside main.js
const envPath = app.isPackaged
    ? path.join(process.resourcesPath, '.env.local')
    : path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// ── Constants ─────────────────────────────────────────────────────────────────
const isDev = !app.isPackaged;
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 680;

// ── Find a free port ──────────────────────────────────────────────────────────
function findFreePort(start = 3100) {
    return new Promise((resolve) => {
        const s = net.createServer();
        s.unref();
        s.on('error', () => resolve(findFreePort(start + 1)));
        s.listen({ port: start, host: '127.0.0.1' }, () => {
            const { port } = s.address();
            s.close(() => resolve(port));
        });
    });
}

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow = null;
let httpServer = null;

// ── Main window ───────────────────────────────────────────────────────────────
async function createWindow() {
    // 1. Find a free port (avoids conflict with anything on 3000)
    const PORT = await findFreePort(3100);

    // 2. Start Next.js server
    //    dir: __dirname works in dev and in packaged (Electron patches asar fs)
    //    asarUnpack in build config ensures .next files are readable at runtime
    const nextApp = next({ dev: false, dir: __dirname });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    await new Promise((resolve, reject) => {
        httpServer.listen(PORT, '127.0.0.1', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // 3. Create BrowserWindow — hidden until content is ready (no white flash)
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        center: true,
        show: false,
        title: 'Allegra | Sistema de Gestión',
        icon: path.join(__dirname, 'public', 'icon-512.png'),
        autoHideMenuBar: true,
        backgroundColor: '#F1F3F8',   // Matches light-mode bg → prevents white flash
        webPreferences: {
            nodeIntegration: false,   // Security: no Node.js in renderer
            contextIsolation: true,   // Security: isolate renderer
            spellcheck: false,
            devTools: isDev,
            webSecurity: true,
        },
    });

    // 4. Remove menu bar (File/Edit/View/etc.)
    Menu.setApplicationMenu(null);

    // 5. Load the app
    await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

    // 6. Show only when fully rendered
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 7. External links → system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const isLocal = url.startsWith(`http://127.0.0.1:${PORT}`) ||
            url.startsWith('http://localhost');
        if (isLocal) return { action: 'allow' };
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        const isLocal = url.startsWith(`http://127.0.0.1:${PORT}`) ||
            url.startsWith('http://localhost');
        if (!isLocal) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // 8. DevTools shortcut in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // 9. Clean up on close
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (httpServer) {
            httpServer.close();
            httpServer = null;
        }
    });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.setName('Allegra');

// Windows: proper taskbar grouping
if (process.platform === 'win32') {
    app.setAppUserModelId('com.allegra.inventario');
}

// Focus existing window if a second instance is launched
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

app.whenReady().then(async () => {
    try {
        await createWindow();
    } catch (err) {
        dialog.showErrorBox(
            'Error al iniciar Allegra',
            `No se pudo iniciar la aplicación:\n\n${err.message || err}\n\nVerifica que el archivo .env.local esté configurado correctamente.`
        );
        app.quit();
    }

    // macOS: re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
