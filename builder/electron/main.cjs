const { app, BrowserWindow, shell, session, protocol } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const config = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'twine-build.json'), 'utf8'));
const allowedLocal = new Set(['twine:', 'devtools:']);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.aac': 'audio/aac', '.flac': 'audio/flac', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mov': 'video/quicktime', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf'
};

protocol.registerSchemesAsPrivileged([{
  scheme: 'twine',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
}]);

function decryptIfProtected(data, key) {
  if (data.length < 34 || data.subarray(0, 6).toString('ascii') !== 'TWENC1') return data;
  if (!key) throw new Error('Protected media key is missing');
  const iv = data.subarray(6, 18);
  const tag = data.subarray(18, 34);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data.subarray(34)), decipher.final()]);
}

function installStoryProtocol() {
  const webRoot = path.resolve(app.getAppPath(), 'dist-web');
  const keyFile = path.join(webRoot, '.twine-media-key');
  const mediaKey = fs.existsSync(keyFile) ? Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'base64') : null;
  protocol.handle('twine', async request => {
    try {
      const url = new URL(request.url);
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      if (relative === '.twine-media-key') return new Response('Not found', { status: 404 });
      const filePath = path.resolve(webRoot, relative);
      if (filePath !== webRoot && !filePath.startsWith(webRoot + path.sep)) {
        return new Response('Forbidden', { status: 403 });
      }
      const data = decryptIfProtected(fs.readFileSync(filePath), mediaKey);
      return new Response(data, {
        status: 200,
        headers: { 'content-type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' }
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

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
  win.loadURL('twine://app/index.html');
}

app.whenReady().then(() => {
  installStoryProtocol();
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  if (!config.security?.allowNetwork) {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
