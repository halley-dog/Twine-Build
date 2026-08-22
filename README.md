# Twine Build

通过 GitHub Actions 将 Twine 发布的 HTML 一键打包成：

- Windows 安装程序 `.exe`
- Windows 免安装版 `.zip`
- Android 安装包 `.apk`

使用者不需要安装 Node.js、Electron、Android Studio、Java、Visual Studio 等开发环境；构建工作全部由 GitHub 的云端 runner 完成。

> 本项目是公共打包模板，不包含维护者的私人故事。`game/index.html` 只是无剧情占位页面，请替换成自己的 Twine 发布文件。

## 使用前须知

- 在 Twine 中选择 **Build → Publish to File / 发布到文件**，上传生成的HTML文件。
- 图片、音乐、视频、字体和脚本需要一起上传，并保持 HTML 原有的相对路径。
- 未配置 Android 正式签名时，只生成适合测试的 debug APK。
- 未配置 Windows 代码签名时，EXE 仍可运行，但 SmartScreen 可能显示“未知发布者”。
- 私人或尚未公开的故事应使用 GitHub Private 仓库。

## 1. 创建自己的仓库

1. 点击本仓库的 **Use this template**。
2. 选择 **Create a new repository**。
3. 填写仓库名称；故事不能公开时选择 **Private**。

如果没有模板按钮，也可以 Fork 本仓库。

## 2. 上传故事

用自己的 Twine 发布文件替换：

```text
game/index.html
```

外部素材应保持相对目录，例如：

```text
game/
├─ index.html
├─ images/
│  ├─ cover.webp
│  └─ character.png
├─ audio/
│  └─ theme.ogg
├─ fonts/
│  └─ story.woff2
└─ scripts/
   └─ extra.js
```

HTML 中应使用：

```html
<img src="images/cover.webp">
<audio src="audio/theme.ogg"></audio>
```

不要使用只能在自己电脑上访问的 `C:\Users\...` 或 `file:///...` 路径。

## 3. 修改配置

编辑根目录的 `twine-build.json`：

```json
{
  "name": "My Twine Story",
  "executableName": "My-Twine-Story",
  "appId": "com.example.mytwinestory",
  "version": "1.0.0",
  "description": "An interactive story built with Twine",
  "publisher": "Twine Author",
  "source": "game/index.html",
  "icon": "resources/icon.png",
  "targets": ["exe", "apk"],
  "window": {
    "width": 1280,
    "height": 800,
    "minWidth": 720,
    "minHeight": 480,
    "resizable": true,
    "startMaximized": false,
    "fullscreen": false
  },
  "security": {
    "allowNetwork": false,
    "openExternalLinks": true
  }
}
```

| 字段 | 说明 |
|---|---|
| `name` | 应用显示名称，可以使用中文 |
| `executableName` | Windows 文件名，建议使用英文、数字和连字符 |
| `appId` | 唯一应用标识，例如 `com.author.storyname` |
| `version` | `1.0.0` 格式的版本号 |
| `publisher` | 作者或工作室名称 |
| `source` | Twine HTML 入口，通常无需修改 |
| `allowNetwork` | 是否允许故事加载远程资源 |
| `openExternalLinks` | 是否用系统浏览器打开 HTTPS 外链 |

`appId` 发布后不要更改，否则 Android 会把新包视为另一款应用，无法正常覆盖升级。

## 4. 设置图标（可选）

将正方形 PNG 图标上传为：

```text
resources/icon.png
```

建议尺寸 `1024 × 1024`。没有图标时，Windows 使用 Electron 默认图标，Android 使用 Capacitor 默认图标。

## 5. 运行打包

1. 打开仓库的 **Actions**。
2. 选择 **Build Twine packages**。
3. 点击 **Run workflow**。
4. 选择构建目标：

| 选项 | 产物 |
|---|---|
| `exe` | Windows 安装 EXE 和免安装 ZIP |
| `apk` | Android APK |
| `all` | 同时构建 EXE 和 APK |

5. 构建完成后，在运行页面底部的 **Artifacts** 下载结果。

Artifact 默认保留 14 天：

- `windows-exe`
- `android-apk`

## Windows 产物

`windows-exe` 包括 NSIS 安装程序和免安装 ZIP。安装器默认按当前用户安装，不强制要求管理员权限；卸载时不会主动删除 Electron 用户数据目录，以免误删游戏存档。

## Android APK 与正式签名

未设置签名时生成可直接安装测试的：

```text
app-debug.apk
```

它不适合应用商店或长期正式分发。正式发布需准备 JKS keystore，并在：

```text
Settings → Secrets and variables → Actions
```

添加：

| Secret | 内容 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | JKS 文件的 Base64 内容 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | 密钥别名 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 |

配置完整后，工作流会额外生成并验证 `app-release.apk`。请永久、加密备份 keystore 和密码；同一应用的后续更新必须继续使用兼容的签名密钥。

PowerShell 转换单行 Base64：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks"))
```

不要把 `.jks`、`.keystore`、`.pfx` 或密码提交到仓库。

## 网络资源与离线运行

默认阻止故事加载远程图片、字体、脚本和接口，但玩家点击 HTTPS 外链时可以交给系统浏览器打开。建议将必需资源全部放进 `game/`。故事确实依赖联网功能时，才把 `allowNetwork` 改为 `true`。

## 本地检查（可选）

GitHub Actions 不要求本地环境。如果已安装 Node.js 24：

```powershell
npm ci
npm run check
```

本地构建 Windows：

```powershell
npm run build:exe
```

## 常见问题

### 图片或音乐丢失

确认文件已经上传到 `game/`，并且 HTML 路径与实际文件名大小写完全一致。

### Actions 没有运行

打开 **Actions** 页面，确认工作流已经启用。模板首次复制后，GitHub 可能要求手动确认。

### Windows 显示未知发布者

这是未使用商业代码签名证书时的正常提示。本项目不会替用户提供签名证书。

### APK 无法覆盖旧版本

通常是 `appId` 改变或两次 APK 使用了不同签名密钥。正式发布前应确定稳定的 `appId` 和 keystore。

### SugarCube 存档是否可用

SugarCube 的浏览器存档通常可以在 Electron 和 Android WebView 中使用，但每次发布前都应测试新建存档、读取存档和覆盖安装升级。

## 安全设计

Windows Electron 外壳默认：

- 禁用 Node.js integration；
- 启用 context isolation 和 renderer sandbox；
- 禁用 `<webview>`；
- 不向 Twine 页面暴露 Electron IPC；
- 默认拒绝摄像头、麦克风、通知等权限；
- 阻止故事直接导航到任意远程网页；
- 外链仅交给系统浏览器。

GitHub Actions 使用锁定的 npm 依赖，并将官方 Actions 固定到具体 commit SHA。

## 隐私

构建时，仓库里的游戏文件会被 GitHub Actions runner 读取并打包。如果内容不能公开，请使用 Private 仓库，并自行检查 GitHub 账户与 Actions 权限。

## 第三方组件

生成应用会包含 Electron、Chromium、Node.js、Capacitor 和 Android 组件。发布作品时，还需遵守故事素材、字体、音乐、图片及各第三方组件的许可证。
