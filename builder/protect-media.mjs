import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'twine-build.json'), 'utf8'));
const webRoot = path.join(root, 'dist-web');
const keyPath = path.join(webRoot, '.twine-media-key');
const protectedExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico',
  '.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac',
  '.mp4', '.webm', '.mov',
  '.woff', '.woff2', '.ttf', '.otf'
]);

if (!config.windows?.protectMedia) {
  fs.rmSync(keyPath, { force: true });
  console.log('[OK] Windows 媒体保护未启用。');
  process.exit(0);
}
if (!fs.existsSync(webRoot)) {
  console.error('[ERROR] dist-web 不存在，请先运行 npm run prepare:web。');
  process.exit(1);
}

const key = crypto.randomBytes(32);
const magic = Buffer.from('TWENC1', 'ascii');
let protectedCount = 0;
let protectedBytes = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (protectedExtensions.has(path.extname(entry.name).toLowerCase())) {
      const plain = fs.readFileSync(fullPath);
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
      const tag = cipher.getAuthTag();
      fs.writeFileSync(fullPath, Buffer.concat([magic, iv, tag, encrypted]));
      protectedCount += 1;
      protectedBytes += plain.length;
    }
  }
}

walk(webRoot);
fs.writeFileSync(keyPath, key.toString('base64'), { mode: 0o600 });
console.log(`[OK] 已使用 AES-256-GCM 保护 ${protectedCount} 个媒体/字体文件（${protectedBytes} bytes）。`);
console.warn('[WARN] 发布保护用于阻止直接解压浏览，并非不可逆 DRM；专业逆向仍可能恢复运行时密钥。');
