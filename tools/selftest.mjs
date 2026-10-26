// Every page's ?selftest in headless Chrome, `pnpm selftest`: the browser half of the checks
// (layer 4 in docs/conventions.md), which `pnpm test` cannot run. It opens each page with
// ?selftest at a desktop size, waits for window.__selftest, and prints each page's result
// with the checks that failed. It exits with 1 if any check failed or a page threw.
//
//     pnpm selftest
//     pnpm selftest --only learner      (the pages whose path contains "learner")

import { parseArgs } from "node:util";
import { openBrowser } from "./headless.mjs";

/** The pages with a ?selftest. */
export const SELFTEST_PAGES = ["dev/01-section/", "dev/02-loom/", "dev/03-learner/", "dev/04-units/", "dev/05-machine/", "dev/06-name-game/"];

const { values } = parseArgs({ options: { only: { type: "string" } } });

const browser = await openBrowser({ width: 1600, height: 900 });
let bad = 0;
try {
  for (const page of SELFTEST_PAGES.filter((p) => !values.only || p.includes(values.only))) {
    const t0 = Date.now();
    await browser.open(`${page}?selftest`, "window.__selftest?.done");
    /** @type {{ done: boolean; passed: number; failed: string[]; results: { id: string; passed: boolean; detail: string }[] } | undefined} */
    const r = await browser.evaluate("window.__selftest && JSON.parse(JSON.stringify(window.__selftest))");
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (!r?.done) {
      bad++;
      console.log(`✗ ${page}: no result after ${secs} s${browser.errors.length ? ` (${browser.errors.join("; ")})` : ""}`);
      continue;
    }
    const failed = r.results.filter((x) => !x.passed);
    if (failed.length || browser.errors.length) bad++;
    console.log(`${failed.length || browser.errors.length ? "✗" : "✓"} ${page}: ${r.passed}/${r.results.length} (${secs} s)`);
    for (const f of failed) console.log(`    ✗ ${f.id}: ${f.detail}`);
    for (const e of browser.errors) console.log(`    ! ${e.split("\n")[0]}`);
  }
} finally {
  await browser.close();
}
process.exitCode = bad ? 1 : 0;
