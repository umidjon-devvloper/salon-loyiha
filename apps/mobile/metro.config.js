const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

/**
 * Monorepo sozlamasi.
 *
 * Metro standart holatda faqat o'z papkasiga qaraydi va `packages/shared`
 * ni topa olmaydi. Ikkita narsa qo'shiladi:
 *  - `watchFolders` — shared o'zgarganda ilova qayta yuklansin
 *  - `nodeModulesPaths` — pnpm symlink'larini yechish uchun
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm symlink'lar bilan ishlashi uchun
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
