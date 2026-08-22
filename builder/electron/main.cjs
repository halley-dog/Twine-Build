const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const config = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'twine-build.json'), 'utf8'));
const allowedLocal = new Set(['file:', 'devtools:']);

function isExternal(url) {
  try { return !allowedLocal.has(new URL(url).protocol); }
  catch { return true; }
}

function createWindow() {
  const options = config.window || {};
  const win = new BrowserWindow({
    title: config.name,
    width: options.width || 1280,
    height: options.height || 800,
    minWidth: options.minWidth || 720,
    minHeight: options.minHeight || 480,
    resizable: options.resizable !== false,
    fullscreen: options.fullscreen === true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      devTools: !app.isPackaged
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (config.security?.openExternalLinks !== false && /^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isExternal(url)) return;
    event.preventDefault();
    if (config.security?.openExternalLinks !== false && /^https?:/i.test(url)) shell.openExternal(url);
  });
  win.once('ready-to-show', () => {
    if (options.startMaximized) win.maximize();
    win.show();
  });
  win.loadFile(path.join(app.getAppPath(), 'dist-web', 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  if (!config.security?.allowNetwork) {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
