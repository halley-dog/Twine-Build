import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const configPath = path.join(root, 'twine-build.json');
const checkOnly = process.argv.includes('--check-only');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function safeName(value) {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim();
}

if (!fs.existsSync(configPath)) fail('缺少 twine-build.json。');
let config = {};
if (!errors.length) {
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch (error) { fail(`twine-build.json 不是有效 JSON：${error.message}`); }
}

for (const key of ['name', 'appId', 'version', 'source']) {
  if (!config[key] || typeof config[key] !== 'string') fail(`配置项 ${key} 必须是非空字符串。`);
}
if (config.version && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(config.version)) {
  fail('version 必须采用 1.2.3 形式。');
}
if (config.appId && !/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(config.appId)) {
  fail('appId 必须采用 com.example.story 形式，且发布后不要更改。');
}
if (config.executableName && safeName(config.executableName) !== config.executableName) {
  fail('executableName 包含 Windows 文件名不允许的字符。');
}
if (config.targets && (!Array.isArray(config.targets) || config.targets.some(t => !['exe', 'apk'].includes(t)))) {
  fail('targets 只能包含 exe 和 apk。');
}

const sourcePath = config.source ? path.resolve(root, config.source) : '';
if (sourcePath && !sourcePath.startsWith(root + path.sep)) fail('source 必须位于仓库目录内。');
if (sourcePath && !fs.existsSync(sourcePath)) fail(`找不到故事文件：${config.source}`);

let html = '';
if (!errors.length) {
  html = fs.readFileSync(sourcePath, 'utf8');
  if (!/<(?:tw-storydata|tw-story)\b/i.test(html)) warn('没有识别到标准 Twine 标记；仍会按普通 HTML 应用打包。');
  if (/\bfile:\/\//i.test(html)) fail('HTML 中包含 file:// 本地路径，打包后无法访问。请改成相对路径。');
  if (/["'(=]\s*[A-Za-z]:[\\/]/.test(html)) fail('HTML 中疑似包含 Windows 绝对路径，请改成相对路径。');
  const remote = [
    ...html.matchAll(/(?:src|href|poster)\s*=\s*["'](https?:\/\/[^"']+)["']/gi),
    ...html.matchAll(/url\(\s*["']?(https?:\/\/[^"')\s]+)["']?\s*\)/gi)
  ].map(match => match[1]);
  const uniqueRemote = [...new Set(remote)];
  if (uniqueRemote.length && !config.security?.allowNetwork) {
    warn(`发现 ${uniqueRemote.length} 个远程地址；当前 allowNetwork=false，运行时请求会被阻止。`);
  }
  const localMedia = [
    ...html.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi),
    ...html.matchAll(/["']([^"']+\.(?:png|jpe?g|webp|gif|svg|bmp|mp3|ogg|wav|m4a|aac|flac|mp4|webm|mov|woff2?|ttf|otf)(?:[?#][^"']*)?)["']/gi)
  ].map(match => match[1])
    .filter(value => !/^(?:data:|blob:|https?:|#|\$\{)/i.test(value));
  const missingMedia = [...new Set(localMedia)].filter(value => {
    const clean = value.split(/[?#]/, 1)[0];
    try { return !fs.existsSync(path.resolve(path.dirname(sourcePath), decodeURIComponent(clean))); }
    catch { return true; }
  });
  if (missingMedia.length) {
    warn(`发现 ${missingMedia.length} 个未上传或路径不匹配的媒体文件：${missingMedia.slice(0, 12).join(', ')}${missingMedia.length > 12 ? ' …' : ''}`);
  }
}

for (const message of warnings) console.warn(`[WARN] ${message}`);
if (errors.length) {
  for (const message of errors) console.error(`[ERROR] ${message}`);
  process.exit(1);
}
console.log(`[OK] 输入：${config.source}`);
console.log(`[OK] 应用：${config.name} ${config.version}`);
if (checkOnly) process.exit(0);

const output = path.join(root, 'dist-web');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const excluded = new Set([
  '.git', '.github', 'android', 'builder', 'dist-web', 'node_modules', 'release',
  'resources', 'signing', 'package.json', 'package-lock.json', 'twine-build.json',
  'capacitor.config.json', '.gitignore', 'README.md', 'LICENSE'
]);
const sourceDirectory = path.dirname(sourcePath);
for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
  if (sourceDirectory === root && excluded.has(entry.name)) continue;
  const from = path.join(sourceDirectory, entry.name);
  const to = path.join(output, entry.name);
  fs.cpSync(from, to, { recursive: true, force: true });
}
if (path.resolve(sourcePath) !== path.resolve(output, 'index.html')) {
  fs.copyFileSync(sourcePath, path.join(output, 'index.html'));
}
if (!fs.existsSync(path.join(output, 'index.html'))) fail('准备后缺少 dist-web/index.html。');

const outputIndexPath = path.join(output, 'index.html');
let outputHtml = fs.readFileSync(outputIndexPath, 'utf8');
const viewportPattern = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i;
const viewportMatch = outputHtml.match(viewportPattern);
if (viewportMatch) {
  let viewportTag = viewportMatch[0];
  const contentMatch = viewportTag.match(/content=(["'])(.*?)\1/i);
  if (contentMatch && !/(?:^|,)\s*viewport-fit\s*=\s*cover(?:\s*,|$)/i.test(contentMatch[2])) {
    const viewportContent = `${contentMatch[2].replace(/\s*,\s*$/, '')}, viewport-fit=cover`;
    viewportTag = viewportTag.replace(contentMatch[0], `content=${contentMatch[1]}${viewportContent}${contentMatch[1]}`);
    outputHtml = outputHtml.replace(viewportMatch[0], viewportTag);
  }
} else if (/<head(?:\s[^>]*)?>/i.test(outputHtml)) {
  outputHtml = outputHtml.replace(
    /<head(?:\s[^>]*)?>/i,
    match => `${match}\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  );
}
fs.writeFileSync(outputIndexPath, outputHtml);

const capConfig = {
  appId: config.appId,
  appName: config.name,
  webDir: 'dist-web',
  server: { androidScheme: 'https' }
};
fs.writeFileSync(path.join(root, 'capacitor.config.json'), JSON.stringify(capConfig, null, 2) + '\n');

const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, 'index.html'))).digest('hex');
const report = {
  name: config.name,
  version: config.version,
  appId: config.appId,
  source: config.source,
  sourceSha256: digest,
  warnings
};
fs.writeFileSync(path.join(output, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`[OK] 已生成 dist-web（index.html SHA-256: ${digest}）`);
