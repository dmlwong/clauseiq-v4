import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const host = "http://127.0.0.1:4173";
const assets = new URL("../docs/clauseiq-v6a-handover/assets/", import.meta.url);
const assetPath = (name) => fileURLToPath(new URL(name, assets));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForApp() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(host);
      if (response.ok) return;
    } catch {
      // The Vite server is still starting.
    }
    await delay(250);
  }
  throw new Error("The local ClauseIQ app did not start on port 4173.");
}

async function capture(page, name, path, focusSelector) {
  await page.goto(`${host}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: assetPath(`${name}.png`), fullPage: true });

  if (focusSelector) {
    const focus = page.locator(focusSelector);
    if (await focus.count()) {
      await focus.first().screenshot({ path: assetPath(`${name}-focus.png`) });
      return;
    }
    // Keep the static guide complete if a dashboard variant does not expose
    // the expected focus hook; the full viewport remains useful context.
    await page.screenshot({ path: assetPath(`${name}-focus.png`) });
  }
}

async function captureFuzzyRerun(page) {
  await page.goto(`${host}/clauseiq-v6a/output-panel`, { waitUntil: "networkidle" });
  const runAgain = page.getByRole("button", { name: "Run Analysis Again" });
  await runAgain.first().click();
  await page.getByRole("link", { name: "Add as new supplier" }).click();
  await page.getByPlaceholder("Enter supplier name").fill("Deloitteeee");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("combobox", { name: "Playbook" }).click();
  await page.getByRole("option", { name: "Procurement_Playbook_Standard_v3.pdf" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "Deloitte_contract.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("prototype PDF"),
  });
  await page.getByText("Found A Supplier Match").waitFor({ state: "visible", timeout: 5000 });
  await page.screenshot({ path: assetPath("rerun-fuzzy-match.png"), fullPage: true });
  await page.getByText("Found A Supplier Match").locator("..").screenshot({
    path: assetPath("rerun-fuzzy-match-focus.png"),
  });
}

await rm(assets, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
const devServer = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], {
  stdio: "ignore",
});

try {
  await waitForApp();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1661, height: 1181 }, deviceScaleFactor: 1 });

  await capture(page, "welcome", "/clauseiq-v6a", "[data-prototype='clauseiq-v6a']");
  await capture(page, "first-result", "/clauseiq-v6a/output-panel", ".clauseiq-responsive-output-panel");
  await capture(page, "history", "/clauseiq-v6a/output-panel?resultScenario=history", ".clauseiq-responsive-output-panel");
  await capture(page, "rerun-setup", "/clauseiq-v6a/output-panel?rerun=upload", ".clauseiq-responsive-output-panel");
  await captureFuzzyRerun(page);
  await capture(
    page,
    "dashboard-first-analysis",
    "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=design-option-2&scenario=first-analysis",
    ".clauseiq-v6a-round-dashboard",
  );
  await capture(
    page,
    "dashboard-outcome-review",
    "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=design-option-2&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-001&previousAnalysisId=a-002&from=v2&to=v3",
    ".clauseiq-v6a-round-dashboard",
  );

  await browser.close();
  console.log(`Captured ClauseIQ v6a handover assets in ${assets.pathname}`);
} finally {
  devServer.kill("SIGTERM");
}
