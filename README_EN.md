# Twine Build

[简体中文](README.md) | [English](README_EN.md)

Package HTML files published by Twine with GitHub Actions into:

- Windows `.exe` installer
- Windows portable `.zip`
- Android `.apk`

Users do not need to install Node.js, Electron, Android Studio, Java, Visual Studio, or any other development environment. GitHub-hosted runners perform the entire build in the cloud.

> This repository is a public packaging template and does not contain the maintainer's private story. `game/index.html` is only a story-free placeholder. Replace it with your own published Twine file.

## Before you start

- In Twine, select **Build → Publish to File**, then upload the generated HTML file.
- Upload images, music, videos, fonts, and scripts together with the HTML while preserving their original relative paths.
- Without Android release signing, the workflow only produces a debug APK intended for testing.
- Without Windows code signing, the EXE still runs, but SmartScreen may show an “Unknown publisher” warning.
- Use a private GitHub repository for private or unreleased stories.

## 1. Create your own repository

1. Click **Use this template** in this repository.
2. Select **Create a new repository**.
3. Enter a repository name. Choose **Private** if the story must not be public.

You can also fork this repository if the template button is unavailable.

## 2. Upload your story

Replace this file with the HTML published by Twine:

```text
game/index.html
```

Keep external assets in their relative directories, for example:

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

Use relative paths in your HTML:

```html
<img src="images/cover.webp">
<audio src="audio/theme.ogg"></audio>
```

Do not use paths that only exist on your computer, such as `C:\Users\...` or `file:///...`.

## 3. Edit the configuration

Edit `twine-build.json` in the repository root:

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
  "security": {
    "allowNetwork": false,
    "openExternalLinks": true
  }
}
```

| Field | Description |
|---|---|
| `name` | Display name of the application; non-Latin characters are supported |
| `executableName` | Windows filename; letters, numbers, and hyphens are recommended |
| `appId` | Unique application identifier, such as `com.author.storyname` |
| `version` | Version number in `1.0.0` format |
| `publisher` | Author or studio name |
| `source` | Twine HTML entry point; normally does not need to be changed |
| `android.immersive` | Hide Android status and navigation bars; edge swipes reveal them temporarily |
| `allowNetwork` | Whether the story may load remote resources |
| `openExternalLinks` | Whether HTTPS links may open in the system browser |

Do not change `appId` after publishing. Android will treat the new package as a different application and it will not update the previously installed version.

## 4. Set an icon (optional)

Upload a square PNG icon as:

```text
resources/icon.png
```

The recommended size is `1024 × 1024`. The same `icon` setting automatically generates the required Windows and Android icons. Platform defaults are used when no icon exists. Set adaptive-icon backgrounds with `android.iconBackgroundColor` and `android.iconBackgroundColorDark`.

## 5. Run a build

1. Open the repository's **Actions** tab.
2. Select **Build Twine packages**.
3. Click **Run workflow**.
4. Choose a build target:

| Option | Output |
|---|---|
| `exe` | Windows installer EXE and portable ZIP |
| `apk` | Android APK |
| `all` | Build EXE and APK together |

5. When the build finishes, download the results from **Artifacts** at the bottom of the workflow run page.

Artifacts are retained for 14 days by default:

- `windows-exe`
- `android-apk`

## Windows output

`windows-exe` contains an NSIS installer and a portable ZIP. The installer is per-user by default and does not require administrator privileges. Uninstalling does not automatically remove Electron's user-data directory, which helps prevent accidental deletion of game saves.

## Android APK and release signing

Without signing configuration, the workflow creates an installable test package:

```text
app-debug.apk
```

It is not suitable for app stores or long-term public distribution. For a release build, prepare a JKS keystore and add the following repository secrets under:

```text
Settings → Secrets and variables → Actions
```

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64 content of the JKS file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

After all secrets are configured, the workflow additionally creates and verifies `app-release.apk`. Keep encrypted, permanent backups of the keystore and passwords. Future updates to the same application must continue to use a compatible signing key.

Convert a JKS file to single-line Base64 in PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks"))
```

Never commit `.jks`, `.keystore`, `.pfx`, or password files to the repository.

## Network resources and offline use

By default, the packaged story cannot load remote images, fonts, scripts, or APIs, but HTTPS links clicked by the player may open in the system browser. Put all required resources inside `game/` whenever possible. Set `allowNetwork` to `true` only when the story genuinely requires online functionality.

## Optional local checks

GitHub Actions does not require a local development environment. If Node.js 24 is already installed, you can validate the project locally:

```powershell
npm ci
npm run check
```

Build Windows locally with:

```powershell
npm run build:exe
```

## Troubleshooting

### Images or audio are missing

Confirm that the files were uploaded inside `game/` and that the letter case of every HTML path exactly matches the real filename.

### Android shows system bars at the top or bottom

Confirm that `android.immersive` is `true` and install an APK built after changing the setting. Immersive mode hides the status and navigation bars; swiping from a screen edge can still reveal system controls temporarily.

### GitHub Actions did not run

Open the **Actions** tab and confirm that workflows are enabled. GitHub may require you to enable Actions manually after creating a repository from the template.

### Windows shows “Unknown publisher”

This is normal when the installer has not been signed with a commercial code-signing certificate. This project does not provide signing certificates for users.

### The APK cannot update an older installation

The usual causes are a changed `appId` or different signing keys between builds. Choose a stable `appId` and keystore before publishing.

### Do SugarCube saves work?

SugarCube browser saves generally work in Electron and Android WebView. Before every release, test creating a save, loading it, and installing an update over the previous version.

## Security design

The Windows Electron wrapper defaults to:

- Node.js integration disabled;
- context isolation and renderer sandbox enabled;
- `<webview>` disabled;
- no Electron IPC exposed to the Twine page;
- camera, microphone, notifications, and other permission requests denied by default;
- direct navigation from the story to arbitrary remote pages blocked;
- external links delegated only to the system browser.

GitHub Actions uses a locked npm dependency tree, and official Actions are pinned to immutable commit SHAs.

## Privacy

During a build, GitHub Actions runners read and package the game files stored in the repository. Use a private repository for non-public content and review your GitHub account and Actions permission settings.

## Third-party components

Generated applications include Electron, Chromium, Node.js, Capacitor, and Android components. When distributing a story, you must also comply with the licenses of its fonts, music, images, other assets, and all third-party components.
