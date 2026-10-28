// Every page's ?selftest in headless Chrome, `pnpm selftest`: the browser half of the checks
// (layer 4 in docs/conventions.md), which `pnpm test` cannot run. It opens each page with
// ?selftest at a desktop size, waits for window.__selftest, and prints each page's result
// with the checks that failed. It exits with 1 if any check failed, a page threw, a page ran no
// checks at all, or --only named no page.
//
//     pnpm selftest
//     pnpm selftest --only learner      (the pages whose path contains "learner")
//     SELFTEST_DETAIL=1 pnpm selftest   (also what each passing check found, for the notes)

import { parseArgs } from "node:util";
import { openBrowser } from "./headless.mjs";

/** The pages with a ?selftest. */
export const SELFTEST_PAGES = ["index.html", "dev/01-section/", "dev/02-loom/", "dev/03-learner/", "dev/04-units/", "dev/05-machine/", "dev/06-name-game/", "dev/07-foundations/"];

const { values } = parseArgs({ options: { only: { type: "string" } } });

const pages = SELFTEST_PAGES.filter((p) => !values.only || p.includes(values.only));
if (pages.length === 0) {
  console.log(`✗ no page's path contains "${values.only}": ${SELFTEST_PAGES.join(", ")}`);
  process.exit(1);
}
const browser = await openBrowser({ width: 1600, height: 900 });
let bad = 0;
try {
  for (const page of pages) {
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
    // a page that ran nothing has not passed: its checks were lost, not met
    const none = r.results.length === 0;
    if (failed.length || browser.errors.length || none) bad++;
    console.log(`${failed.length || browser.errors.length || none ? "✗" : "✓"} ${page}: ${r.passed}/${r.results.length} (${secs} s)${none ? ": no checks ran" : ""}`);
    for (const f of failed) console.log(`    ✗ ${f.id}: ${f.detail}`);
    if (process.env.SELFTEST_DETAIL) for (const x of r.results.filter((y) => y.passed)) console.log(`    ✓ ${x.id}: ${x.detail}`);
    for (const e of browser.errors) console.log(`    ! ${e.split("\n")[0]}`);
  }
} finally {
  await browser.close();
}
process.exitCode = bad ? 1 : 0;
