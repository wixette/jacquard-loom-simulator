// Copies the browser files of three.js from node_modules into vendor/, where the pages load
// them through their import maps. Run
// `pnpm vendor` after changing the version in package.json or the list below;
// tests/vendor.test.js fails while vendor/ is out of date.

import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Files the pages need, by package. Addons import each other by relative path. */
export const VENDORED = {
  three: [
    "LICENSE",
    "build/three.module.js",
    "build/three.core.js",
    "examples/jsm/controls/OrbitControls.js",
    "examples/jsm/loaders/GLTFLoader.js",
    "examples/jsm/utils/BufferGeometryUtils.js",
    "examples/jsm/utils/SkeletonUtils.js", // GLTFLoader imports it
  ],
};

/**
 * @param {string} pkg
 * @param {string} file
 */
export const sourcePath = (pkg, file) => join(ROOT, "node_modules", pkg, file);
/**
 * @param {string} pkg
 * @param {string} file
 */
export const vendorPath = (pkg, file) => join(ROOT, "vendor", pkg, file);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [pkg, files] of Object.entries(VENDORED)) {
    rmSync(join(ROOT, "vendor", pkg), { recursive: true, force: true });
    for (const file of files) {
      mkdirSync(dirname(vendorPath(pkg, file)), { recursive: true });
      copyFileSync(sourcePath(pkg, file), vendorPath(pkg, file));
    }
    process.stdout.write(`vendor/${pkg}: ${files.length} files\n`);
  }
}
