# Twine Build

[简体中文](README.md) | [English](README_EN.md)

Package HTML files published by Twine with GitHub Actions into:

- Windows `.exe` installer
- Android `.apk`

Users do not need to install Node.js, Electron, Android Studio, Java, Visual Studio, or any other development environment. GitHub-hosted runners perform the entire build in the cloud.

> This repository is a public packaging template and does not contain the maintainer's private story. `game/index.html` is only a story-free placeholder. Replace it with your own published Twine file.

## Before you start

- In Twine, select **Build → Publish to File**, then upload the generated HTML file.
- Upload images, music, videos, fonts, and scripts together with the HTML while preserving their original relative paths.
- APK builds can be `debug` or `release`; release requires the repository owner's signing key in GitHub Actions Secrets.
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
    "fullscreenBackgroundColor": "#000000",
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

### Basic settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `name` | string | `My Twine Story` | Installed application display name; non-Latin characters are supported |
| `executableName` | string | `My-Twine-Story` | Windows executable and installer filename without an extension; letters, numbers, `-`, and `_` are recommended |
| `appId` | string | `com.example.mytwinestory` | Unique Android identity and update identifier; use reverse-domain notation and never change it after release |
| `version` | string | `1.0.0` | Application version in `major.minor.patch` format |
| `versionCode` | integer | `1` | Android internal version; increase it for every release |
| `description` | string | example text | Short application description stored in Windows package metadata |
| `publisher` | string | `Twine Author` | Author, publisher, or studio name stored in Windows metadata |
| `source` | path | `game/index.html` | Twine-published HTML entry point, relative to the repository root |
| `icon` | path | `resources/icon.png` | Shared Windows/Android source icon; a transparent or square 1024×1024 PNG is recommended |
| `targets` | string array | `["exe", "apk"]` | Declares intended project targets; manual Actions runs still use the `exe/apk/all` selector |

### `window`: Windows window settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `window.width` | integer | `1280` | Initial window width in CSS pixels |
| `window.height` | integer | `800` | Initial window height in CSS pixels |
| `window.minWidth` | integer | `720` | Minimum width to which the user may resize the window |
| `window.minHeight` | integer | `480` | Minimum height to which the user may resize the window |
| `window.resizable` | boolean | `true` | Whether the window can be resized |
| `window.startMaximized` | boolean | `false` | Start maximized instead of using the normal width and height |
| `window.fullscreen` | boolean | `false` | Start in Windows fullscreen mode |

### `android`: Android settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `android.immersive` | boolean | `true` | Hide status and navigation bars; edge swipes reveal them temporarily |
| `android.fullscreenBackgroundColor` | color string | `#000000` | Fullscreen fallback color used around cutouts, during system-bar transitions, or before the WebView finishes drawing |
| `android.iconBackgroundColor` | color string | `#ffffff` | Adaptive-icon background in light mode |
| `android.iconBackgroundColorDark` | color string | `#111111` | Adaptive-icon background in dark mode; retained for compatibility with future dark-icon output |

### `windows`: Windows packaging settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `windows.protectMedia` | boolean | `true` | Encrypt images, audio, video, and fonts in Windows packages with AES-256-GCM; HTML/CSS/JS remain readable |

### `security`: runtime security settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `security.allowNetwork` | boolean | `false` | Allow HTTP/HTTPS resources to load inside the application; keep disabled for offline stories |
| `security.openExternalLinks` | boolean | `true` | Open clicked HTTP/HTTPS links in the system's default browser |

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
| `exe` | Windows installer EXE |
| `apk` | Android APK |
| `all` | Build EXE and APK together |

When the target includes APK, also choose `apk_variant`:

| Option | Behavior | Output |
|---|---|---|
| `debug` | Android debug build; custom signing settings are ignored | `app-debug.apk` |
| `release` | Optimized release build; uses the user's key when available, otherwise the public template test key | `app-release.apk` or `app-release-test-signed.apk` |

Manual runs default to `debug`; pushes to `main` automatically build `release`.

5. When the build finishes, download the results from **Artifacts** at the bottom of the workflow run page.

Artifacts are retained for 14 days by default:

- `windows-exe`
- `android-apk-debug` or `android-apk-release`

## Windows output

The `windows-exe` artifact contains only one NSIS installer. GitHub always wraps downloaded artifacts in an outer ZIP; after extracting it, keep the `.exe`. The installer is per-user by default and does not require administrator privileges. Uninstalling does not automatically remove Electron's user-data directory, which helps prevent accidental deletion of game saves.

Electron must include Chromium, so the installer is normally still around 80–130 MB even when the Twine HTML is small.

## Windows EXE code signing

Production Windows signing cannot use a public template key like the APK test flow. A public or self-signed certificate is not trusted by ordinary Windows systems, does not remove the SmartScreen “Unknown publisher” warning, and would let anyone impersonate the same publisher.

The workflow uses automatic detection:

- Neither `WIN_CSC_LINK` nor `WIN_CSC_KEY_PASSWORD` is configured: build an unsigned EXE normally.
- Both are configured: Electron Builder signs the application, uninstaller, and final installer automatically.
- Only one is configured: fail the build so an unsigned result is not mistaken for a signed one.

For public distribution, use a Windows Authenticode code-signing certificate issued by a CA trusted by Microsoft, or Microsoft Azure Artifact Signing. Azure Public Trust has identity and geographic eligibility restrictions; otherwise, obtain a code-signing service from a trusted CA available in your region. A newly issued certificate normally still needs time to build SmartScreen reputation, so signing does not guarantee that every first download is warning-free.

If your signing provider supplies an exportable `.pfx`/`.p12` file, convert it to single-line Base64 in PowerShell:

```powershell
$certificateFile = "E:\Twine-Signing\windows-code-signing.pfx"
$certificateBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certificateFile))
$certificateBase64 | Set-Clipboard
```

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `WIN_CSC_LINK` | Single-line Base64 content of the `.pfx`/`.p12` file |
| `WIN_CSC_KEY_PASSWORD` | Certificate-file password |

Run the EXE build again. Never commit the certificate, Base64 text, or password. Some newer code-signing products keep keys in hardware tokens or cloud services and cannot export a PFX; those products require the provider's dedicated GitHub Actions or cloud-signing integration instead of these two secrets.

References: [Microsoft Windows code-signing options](https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options) and [Electron Builder Windows signing](https://www.electron.build/docs/features/code-signing/code-signing-win/).

## Windows media protection

When `windows.protectMedia` is enabled, images, audio, video, and fonts in the Windows package are encrypted with AES-256-GCM. At runtime, the application decrypts them on demand through its internal `twine://` protocol, without changing existing relative paths in the HTML. HTML, CSS, and JavaScript are not encrypted.

This feature prevents casual extraction and browsing of assets; it is not unbreakable DRM. The decryption key must ship with the application, so a skilled reverse engineer may still recover the key and assets. Android APK media protection is not currently enabled.

## Android APK builds and signing

Select `apk_variant: debug` to create:

```text
app-debug.apk
```

The debug package is installable for testing, but is not suitable for app stores or long-term public distribution.

Selecting `apk_variant: release` always produces a zipaligned, signed, and verified release APK:

- All four signing secrets are required and the output is `app-release.apk`.
- If any signing secret is absent, the release build fails instead of using an unsuitable fallback key.

### Generate a production signing key on Windows

Only a JDK is required to generate the key; Android Studio is not required. First check in PowerShell:

```powershell
keytool -help
```

If `keytool` is unavailable, install JDK 21:

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

Close and reopen PowerShell after installation. Create the key outside the repository. This example creates a 4096-bit RSA JKS, valid for about 27 years, under `E:\Twine-Signing`:

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

Follow the prompts to set the keystore password, certificate details, and key password. Remember the `twine-release` alias and keep permanent backups of the keystore and passwords. Future updates to the same Android application must use the same signing key.

Inspect the key and certificate fingerprints:

```powershell
keytool -list -v `
  -keystore "E:\Twine-Signing\twine-release.jks" `
  -alias "twine-release"
```

Convert the JKS to single-line Base64 and copy it to the clipboard:

```powershell
$signingFile = "E:\Twine-Signing\twine-release.jks"
$signingBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($signingFile))
$signingBase64 | Set-Content -NoNewline "E:\Twine-Signing\twine-release-base64.txt"
$signingBase64 | Set-Clipboard
```

### Add GitHub Actions secrets

In your repository, open:

```text
Settings → Secrets and variables → Actions
```

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64 content of the JKS file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `twine-release`, or the alias used when generating the key |
| `ANDROID_KEY_PASSWORD` | Key password |

After all secrets are configured, the release workflow creates and verifies `app-release.apk`. Keep encrypted, permanent backups of the keystore and passwords. Future updates to the same application must continue to use a compatible signing key. Android will normally require uninstalling the test-key build when switching to your production key.

Never commit your own `.jks`, `.keystore`, `.pfx`, Base64 key export, or password files.

## Network resources and offline use

By default, the packaged story cannot load remote images, fonts, scripts, or APIs, but HTTPS links clicked by the player may open in the system browser. Put all required resources inside `game/` whenever possible. Set `allowNetwork` to `true` only when the story genuinely requires online functionality.

## Troubleshooting

### Images or audio are missing

Confirm that the files were uploaded inside `game/` and that the letter case of every HTML path exactly matches the real filename.

### Android shows system bars at the top or bottom

Confirm that `android.immersive` is `true` and install a newly built APK. The builder enables edge-to-edge display, covers display cutouts, and adds `viewport-fit=cover` to the web viewport. Immersive mode hides the status and navigation bars; swiping from a screen edge can still reveal system controls temporarily. `android.fullscreenBackgroundColor` controls the edge color before the page finishes drawing.

### GitHub Actions did not run

Open the **Actions** tab and confirm that workflows are enabled. GitHub may require you to enable Actions manually after creating a repository from the template.

### Windows shows “Unknown publisher”

This is normal when the installer has not been signed with a publicly trusted code-signing certificate. Configure `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`, then rebuild. A new certificate may still need time to establish SmartScreen reputation.

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
