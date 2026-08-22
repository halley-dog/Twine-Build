import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'twine-build.json'), 'utf8'));
const androidRoot = path.join(root, 'android');

if (!fs.existsSync(androidRoot)) {
  console.error('[ERROR] Android 工程不存在，请先运行 npx cap add android。');
  process.exit(1);
}

function findFile(directory, filename) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, filename);
      if (found) return found;
    } else if (entry.name === filename) {
      return fullPath;
    }
  }
  return null;
}

if (config.android?.immersive !== false) {
  const activityPath = findFile(path.join(androidRoot, 'app', 'src', 'main', 'java'), 'MainActivity.java');
  if (!activityPath) {
    console.error('[ERROR] 找不到 Android MainActivity.java。');
    process.exit(1);
  }

  let source = fs.readFileSync(activityPath, 'utf8');
  if (!source.includes('TWINE_BUILD_IMMERSIVE')) {
    source = source.replace(
      'import com.getcapacitor.BridgeActivity;',
      `import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;\nimport android.os.Build;\nimport android.view.WindowManager;\nimport androidx.core.view.WindowCompat;\nimport androidx.core.view.WindowInsetsCompat;\nimport androidx.core.view.WindowInsetsControllerCompat;`
    );
    source = source.replace(
      /public class MainActivity extends BridgeActivity\s*\{\s*\}/,
      `public class MainActivity extends BridgeActivity {\n  // TWINE_BUILD_IMMERSIVE\n  private void hideSystemBars() {\n    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);\n    WindowInsetsControllerCompat controller =\n        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());\n    controller.hide(WindowInsetsCompat.Type.systemBars());\n    controller.setSystemBarsBehavior(\n        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);\n  }\n\n  @Override\n  protected void onCreate(Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {\n      WindowManager.LayoutParams attributes = getWindow().getAttributes();\n      attributes.layoutInDisplayCutoutMode =\n          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;\n      getWindow().setAttributes(attributes);\n    }\n    hideSystemBars();\n  }\n\n  @Override\n  public void onWindowFocusChanged(boolean hasFocus) {\n    super.onWindowFocusChanged(hasFocus);\n    if (hasFocus) hideSystemBars();\n  }\n}`
    );
    if (!source.includes('TWINE_BUILD_IMMERSIVE')) {
      console.error('[ERROR] 无法修改 MainActivity.java，Capacitor 模板结构可能已经变化。');
      process.exit(1);
    }
    fs.writeFileSync(activityPath, source);
    console.log('[OK] 已启用 Android 沉浸式全屏；从屏幕边缘滑动可临时呼出系统栏。');
  }
}

const configuredIcon = config.icon ? path.resolve(root, config.icon) : null;
if (configuredIcon && fs.existsSync(configuredIcon)) {
  const resDirectory = path.join(androidRoot, 'app', 'src', 'main', 'res');
  const densities = {
    mdpi: { legacy: 48, adaptive: 108 },
    hdpi: { legacy: 72, adaptive: 162 },
    xhdpi: { legacy: 96, adaptive: 216 },
    xxhdpi: { legacy: 144, adaptive: 324 },
    xxxhdpi: { legacy: 192, adaptive: 432 }
  };
  const background = config.android?.iconBackgroundColor || '#ffffff';

  for (const [density, sizes] of Object.entries(densities)) {
    const directory = path.join(resDirectory, `mipmap-${density}`);
    fs.mkdirSync(directory, { recursive: true });
    for (const entry of fs.readdirSync(directory)) {
      if (/^ic_launcher(?:_round|_foreground)?\./.test(entry)) {
        fs.rmSync(path.join(directory, entry), { force: true });
      }
    }
    await sharp(configuredIcon)
      .resize(sizes.legacy, sizes.legacy, { fit: 'contain', background })
      .png()
      .toFile(path.join(directory, 'ic_launcher.png'));
    await sharp(configuredIcon)
      .resize(sizes.legacy, sizes.legacy, { fit: 'contain', background })
      .png()
      .toFile(path.join(directory, 'ic_launcher_round.png'));
    const foregroundSize = Math.round(sizes.adaptive * 0.66);
    await sharp(configuredIcon)
      .resize(foregroundSize, foregroundSize, { fit: 'contain' })
      .extend({
        top: Math.floor((sizes.adaptive - foregroundSize) / 2),
        bottom: Math.ceil((sizes.adaptive - foregroundSize) / 2),
        left: Math.floor((sizes.adaptive - foregroundSize) / 2),
        right: Math.ceil((sizes.adaptive - foregroundSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(directory, 'ic_launcher_foreground.png'));
  }

  const valuesDirectory = path.join(resDirectory, 'values');
  fs.mkdirSync(valuesDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDirectory, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${background}</color>\n</resources>\n`
  );
  console.log(`[OK] 已从 ${config.icon} 生成 Android 各尺寸图标。`);
} else {
  console.warn(`[WARN] 图标文件不存在：${config.icon || '(未配置)'}；Android 将使用默认图标。`);
}
