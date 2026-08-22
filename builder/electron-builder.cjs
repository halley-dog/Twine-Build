const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'twine-build.json'), 'utf8'));
const exeName = config.executableName || config.name.replace(/[^A-Za-z0-9_-]+/g, '-');
const iconPath = path.join(root, config.icon || 'resources/icon.png');
const hasIcon = fs.existsSync(iconPath);

module.exports = {
  appId: config.appId,
  productName: config.name,
  executableName: exeName,
  copyright: `Copyright © ${new Date().getFullYear()} ${config.publisher || ''}`,
  directories: { output: 'release/exe' },
  files: [
    'builder/electron/**/*',
    'dist-web/**/*',
    'twine-build.json',
    '!**/*.map'
  ],
  extraMetadata: {
    name: exeName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    version: config.version,
    description: config.description || config.name,
    author: config.publisher || 'Twine Author',
    main: 'builder/electron/main.cjs'
  },
  asar: true,
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }, { target: 'zip', arch: ['x64'] }],
    ...(hasIcon ? { icon: iconPath } : {}),
    artifactName: `${exeName}-${config.version}-win-x64.${'${ext}'}`
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    deleteAppDataOnUninstall: false,
    installerLanguages: ['zh_CN', 'en_US']
  }
};
