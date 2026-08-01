const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');
const { existsSync } = require('node:fs');

/**
 * Monorepo sozlamasi.
 *
 * Metro standart holatda faqat o'z papkasiga qaraydi va `packages/shared`
 * ni topa olmaydi:
 *  - `watchFolders` — shared o'zgarganda ilova qayta yuklansin
 *  - `nodeModulesPaths` — ildizdagi node_modules ham ko'rinsin
 *
 * ⚠️ Loyiha npm va pnpm ikkalasida ham ishlaydi. Farq shundaki, npm
 * bog'liqliklarni ildizga yassi (hoisted) qo'yadi, pnpm esa symlink bilan.
 * `disableHierarchicalLookup` FAQAT pnpm uchun kerak — npm'da u ildizdagi
 * paketlarni ko'rinmas qilib qo'yadi va ilova ochilmaydi.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.unstable_enableSymlinks = true;

// pnpm ishlatilganda: `node_modules/.pnpm` mavjudligiga qarab aniqlanadi
const usingPnpm = existsSync(path.resolve(workspaceRoot, 'node_modules/.pnpm'));
if (usingPnpm) config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
