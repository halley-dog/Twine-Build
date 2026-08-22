# Twine Build

[简体中文](README.md) | [English](README_EN.md)

通过 GitHub Actions 将 Twine 发布的 HTML 一键打包成：

- Windows 安装程序 `.exe`
- Android 安装包 `.apk`

使用者不需要安装 Node.js、Electron、Android Studio、Java、Visual Studio 等开发环境；构建工作全部由 GitHub 的云端 runner 完成。

> 本项目是公共打包模板，不包含维护者的私人故事。`game/index.html` 只是无剧情占位页面，请替换成自己的 Twine 发布文件。

## 使用前须知

- 在 Twine 中选择 **Build → Publish to File / 发布到文件**，上传生成的 HTML 文件。
- 图片、音乐、视频、字体和脚本需要一起上传，并保持 HTML 原有的相对路径。
- APK 可选择 `debug` 或 `release`；release 优先使用用户签名，未配置时使用公开模板测试签名。
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
  "android": {
    "immersive": true,
    "iconBackgroundColor": "#ffffff",
    "iconBackgroundColorDark": "#111111"
  },
  "windows": {
    "protectMedia": true
  },
  "security": {
    "allowNetwork": false,
    "openExternalLinks": true
  }
}
```

### 基本参数

| 参数 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `name` | 字符串 | `My Twine Story` | 安装后显示的应用名称，可以使用中文 |
| `executableName` | 字符串 | `My-Twine-Story` | Windows 主程序和安装包文件名，不含扩展名；建议只用英文、数字、`-`、`_` |
| `appId` | 字符串 | `com.example.mytwinestory` | Android 应用唯一标识，也是升级识别依据；应采用反向域名格式，发布后不要修改 |
| `version` | 字符串 | `1.0.0` | 应用版本号，必须采用 `主版本.次版本.修订号` 格式 |
| `description` | 字符串 | 示例说明 | Windows 包元数据中的应用简介 |
| `publisher` | 字符串 | `Twine Author` | 作者、发行者或工作室名称，写入 Windows 元数据 |
| `source` | 路径 | `game/index.html` | Twine 发布 HTML 的入口文件；相对仓库根目录 |
| `icon` | 路径 | `resources/icon.png` | Windows/Android 共用图标源；推荐透明或方形 1024×1024 PNG |
| `targets` | 字符串数组 | `["exe", "apk"]` | 声明项目计划支持的目标；Actions 手动构建时仍以 `exe/apk/all` 下拉选择为准 |

### `window`：Windows 窗口参数

| 参数 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `window.width` | 整数 | `1280` | 初始窗口宽度，单位为 CSS 像素 |
| `window.height` | 整数 | `800` | 初始窗口高度，单位为 CSS 像素 |
| `window.minWidth` | 整数 | `720` | 用户可缩小到的最小宽度 |
| `window.minHeight` | 整数 | `480` | 用户可缩小到的最小高度 |
| `window.resizable` | 布尔值 | `true` | 是否允许用户调整窗口大小 |
| `window.startMaximized` | 布尔值 | `false` | 是否启动后最大化；优先于普通宽高显示 |
| `window.fullscreen` | 布尔值 | `false` | 是否以 Windows 全屏模式启动 |

### `android`：Android 参数

| 参数 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `android.immersive` | 布尔值 | `true` | 隐藏状态栏和导航栏；从屏幕边缘滑动可临时呼出系统栏 |
| `android.iconBackgroundColor` | 颜色字符串 | `#ffffff` | Android 自适应图标在浅色模式下的背景色 |
| `android.iconBackgroundColorDark` | 颜色字符串 | `#111111` | Android 自适应图标在深色模式下的背景色；当前生成器保留该参数用于兼容后续深色图标输出 |

### `windows`：Windows 打包参数

| 参数 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `windows.protectMedia` | 布尔值 | `true` | 使用 AES-256-GCM 加密 Windows 包中的图片、音频、视频和字体；HTML/CSS/JS 不加密 |

### `security`：运行安全参数

| 参数 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `security.allowNetwork` | 布尔值 | `false` | 是否允许故事在应用内请求 HTTP/HTTPS 远程资源；离线故事建议保持关闭 |
| `security.openExternalLinks` | 布尔值 | `true` | 玩家点击 HTTP/HTTPS 外链时，是否交给系统默认浏览器打开 |

`appId` 发布后不要更改，否则 Android 会把新包视为另一款应用，无法正常覆盖升级。

## 4. 设置图标（可选）

将正方形 PNG 图标上传为：

```text
resources/icon.png
```

建议尺寸 `1024 × 1024`。同一个 `icon` 配置会自动生成 Windows 和 Android 所需图标；没有图标时使用平台默认图标。Android 自适应图标的背景色可通过 `android.iconBackgroundColor` 和 `android.iconBackgroundColorDark` 设置。

## 5. 运行打包

1. 打开仓库的 **Actions**。
2. 选择 **Build Twine packages**。
3. 点击 **Run workflow**。
4. 选择构建目标：

| 选项 | 产物 |
|---|---|
| `exe` | Windows 安装程序 EXE |
| `apk` | Android APK |
| `all` | 同时构建 EXE 和 APK |

如果目标包含 APK，再选择 `apk_variant`：

| 选项 | 行为 | 产物 |
|---|---|---|
| `debug` | Android 调试构建，不读取自定义签名 | `app-debug.apk` |
| `release` | 优化的 release 构建；优先使用用户签名，否则使用公开模板测试签名 | `app-release.apk` 或 `app-release-test-signed.apk` |

手动运行默认选择 `debug`；推送到 `main` 自动触发时默认构建 `release`。

5. 构建完成后，在运行页面底部的 **Artifacts** 下载结果。

构建产物默认保留 14 天：

- `windows-exe`
- `android-apk-debug` 或 `android-apk-release`

## Windows 产物

`windows-exe` Artifact 只包含一个 NSIS 安装程序。GitHub 下载 Artifact 时固定会在外面套一层 ZIP，解压后只需保留其中的 `.exe`。安装器默认按当前用户安装，不强制要求管理员权限；卸载时不会主动删除 Electron 用户数据目录，以免误删游戏存档。

Electron 必须携带 Chromium，因此安装包通常仍有约 80–130 MB，即使 Twine HTML 很小也不会只有几 MB。

## Windows EXE 代码签名

Windows 正式签名不能像 APK 一样使用公开模板密钥。公开或自签名证书不受普通 Windows 电脑信任，无法消除 SmartScreen 的“未知发布者”提示，还会允许任何人冒充同一发布者。

工作流采用自动模式：

- `WIN_CSC_LINK` 和 `WIN_CSC_KEY_PASSWORD` 都未配置：正常生成未签名 EXE。
- 两项都已配置：Electron Builder 自动签名程序、卸载程序和最终安装包。
- 只配置一项：构建主动失败，防止误以为产物已签名。

正式对外分发可选择受 Microsoft 信任的 CA 签发的 Windows Authenticode 代码签名证书，或使用 Microsoft Azure Artifact Signing。Azure 的 Public Trust 有身份和地区限制；不符合条件时应向支持所在地区的可信 CA 购买代码签名服务。新证书通常仍需逐渐积累 SmartScreen 信誉，签名不保证首次下载立刻没有警告。

如果签名服务提供可导出的 `.pfx`/`.p12` 文件，在 PowerShell 转为单行 Base64：

```powershell
$certificateFile = "E:\Twine-Signing\windows-code-signing.pfx"
$certificateBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certificateFile))
$certificateBase64 | Set-Clipboard
```

在仓库的 **Settings → Secrets and variables → Actions** 添加：

| Secret | 内容 |
|---|---|
| `WIN_CSC_LINK` | `.pfx`/`.p12` 文件的单行 Base64 内容 |
| `WIN_CSC_KEY_PASSWORD` | 证书文件密码 |

随后重新运行 EXE 构建即可。不要把证书、Base64 文本或密码提交到仓库。部分新代码签名证书使用硬件令牌或云端密钥，无法导出 PFX；这类证书需要供应商专用的 GitHub Actions/云签名集成，不能使用上述两个 Secrets。

参考：[Microsoft Windows 代码签名方案](https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options)、[Electron Builder Windows 签名](https://www.electron.build/docs/features/code-signing/code-signing-win/)。

## Windows 媒体保护

启用 `windows.protectMedia` 后，图片、音频、视频和字体在 Windows 包内会使用 AES-256-GCM 加密，应用运行时通过内部 `twine://` 协议按需解密，不影响 HTML 中原有相对路径。HTML、CSS 和 JavaScript 不加密。

该功能用于防止普通用户直接解压安装包或 ASAR 后浏览素材，不是不可破解的 DRM。解密密钥必须随应用发布，专业逆向仍可能恢复密钥和素材。Android APK 当前不启用这项媒体保护。

## Android APK 构建与签名

运行工作流时选择 `apk_variant: debug`，会生成：

```text
app-debug.apk
```

debug 包可直接安装测试，但不适合应用商店或长期正式分发。

选择 `apk_variant: release` 后一定会生成经过 zipalign、签名并验证的 release APK：

- 四个签名 Secrets 全部存在时，使用用户自己的密钥，产物为 `app-release.apk`。
- 四个 Secrets 全部不存在时，使用仓库公开的固定测试密钥，产物为 `app-release-test-signed.apk`。
- 只配置一部分 Secrets 时构建会失败，防止错误签名。

公开测试密钥只能让无配置用户稳定安装和覆盖后续测试版本。私钥对所有人可见，不能证明作者身份，禁止用于应用商店、正式发布或任何需要可信身份的场景。

### 在 Windows 本地生成正式签名

生成签名只需要 JDK，不需要安装 Android Studio。先在 PowerShell 检查：

```powershell
keytool -help
```

如果找不到 `keytool`，可安装 JDK 21：

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

安装后关闭并重新打开 PowerShell。然后在仓库之外创建密钥；以下示例会在 `E:\Twine-Signing` 中生成有效期约 27 年的 RSA 4096 位 JKS：

```powershell
New-Item -ItemType Directory -Force "E:\Twine-Signing"
Set-Location "E:\Twine-Signing"
keytool -genkeypair -v `
  -keystore "twine-release.jks" `
  -storetype JKS `
  -alias "twine-release" `
  -keyalg RSA `
  -keysize 4096 `
  -validity 10000
```

根据提示设置密钥库密码、证书信息和密钥密码。请记住别名 `twine-release`，并永久保存密钥库及密码；同一 Android 应用的后续更新必须继续使用同一签名密钥。

检查生成结果和证书指纹：

```powershell
keytool -list -v `
  -keystore "E:\Twine-Signing\twine-release.jks" `
  -alias "twine-release"
```

把 JKS 转为可粘贴到 GitHub Secret 的单行 Base64，并复制到剪贴板：

```powershell
$signingFile = "E:\Twine-Signing\twine-release.jks"
$signingBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($signingFile))
$signingBase64 | Set-Content -NoNewline "E:\Twine-Signing\twine-release-base64.txt"
$signingBase64 | Set-Clipboard
```

### 添加 GitHub Actions Secrets

在自己的仓库中打开：

```text
Settings → Secrets and variables → Actions
```

添加：

| Secret | 内容 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | JKS 文件的 Base64 内容 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | `twine-release`，或生成密钥时使用的别名 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 |

配置完整后，release 工作流会生成并验证 `app-release.apk`。请永久、加密备份 keystore 和密码；同一应用的后续更新必须继续使用兼容的签名密钥。从模板测试签名切换到正式签名时，Android 通常要求先卸载测试版。

不要把你自己的 `.jks`、`.keystore`、`.pfx` 或密码提交到仓库。仓库中的 `resources/template-test-signing.pfx` 是特意公开的模板测试密钥，不是秘密。

## 网络资源与离线运行

默认阻止故事加载远程图片、字体、脚本和接口，但玩家点击 HTTPS 外链时可以交给系统浏览器打开。建议将必需资源全部放进 `game/`。故事确实依赖联网功能时，才把 `allowNetwork` 改为 `true`。

## 常见问题

### 图片或音乐丢失

确认文件已经上传到 `game/`，并且 HTML 路径与实际文件名大小写完全一致。

### Android 顶部或底部出现系统栏

确认 `android.immersive` 为 `true`，并使用修改配置后新构建的 APK。沉浸模式会隐藏状态栏和导航栏，从屏幕边缘滑动仍可临时呼出系统控件。

### Actions 没有运行

打开 **Actions** 页面，确认工作流已经启用。模板首次复制后，GitHub 可能要求手动确认。

### Windows 显示未知发布者

这是未使用受信任的代码签名证书时的正常提示。配置 `WIN_CSC_LINK` 和 `WIN_CSC_KEY_PASSWORD` 后重新构建；新证书仍可能需要一段时间积累 SmartScreen 信誉。

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
