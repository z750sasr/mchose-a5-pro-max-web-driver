import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://a5-control.test/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the A5 Control product interface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /A5 Control/i);
  assert.match(html, /MCHOSE A5/);
  assert.match(html, /Connect device/);
  assert.match(html, /FIRST-GENERATION HARDWARE/);
  assert.match(html, /About me/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("assembles reusable driver sections from the active model", async () => {
  const [page, devicePanel, aboutPanel] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/driver/device-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/driver/about-panel.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /DEFAULT_MOUSE_MODEL/);
  assert.match(page, /<PerformancePanel/);
  assert.match(page, /<DevicePanel/);
  assert.match(devicePanel, /CONNECTION MANAGER/);
  assert.match(devicePanel, /Approve another device/);
  assert.match(aboutPanel, /src="about-me\.html"/);
  assert.match(aboutPanel, /sandbox=/);
});

test("keeps USB identities and capability limits in the mouse registry", async () => {
  const [model, registry, protocol] = await Promise.all([
    readFile(new URL("../lib/mouse-models/a5-pro-max.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/mouse-models/registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/a5-protocol.ts", import.meta.url), "utf8"),
  ]);
  assert.match(model, /0xf019/);
  assert.match(model, /maxDpi: 26000/);
  assert.match(registry, /MOUSE_MODEL_REGISTRY/);
  assert.match(protocol, /listWebHidFilters\(A5_PRO_MAX_MODEL\)/);
});

test("keeps a sleeping wireless mouse attached through its receiver", async () => {
  const [page, chrome, hero] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/driver/chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/driver/mouse-hero.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /remains connected while the wireless mouse is asleep/);
  assert.match(page, /window\.setInterval\(\(\) => void checkForWake\(\), 2500\)/);
  assert.match(page, /await loadSnapshot\(protocol\)/);
  assert.match(chrome, /mouse standby/);
  assert.match(hero, /information will load automatically/);
});

test("deduplicates browser HID objects and follows the physical DPI button", async () => {
  const [page, protocol] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/a5-protocol.ts", import.meta.url), "utf8"),
  ]);
  assert.match(protocol, /new Map<string, A5HIDDevice>\(\)/);
  assert.match(protocol, /if \(!logicalConnections\.has\(key\)\)/);
  assert.match(protocol, /getActiveDpiStage\(profile: number\)/);
  assert.match(protocol, /private commandQueue: Promise<void>/);
  assert.match(page, /protocol\.getActiveDpiStage\(snapshot\.profile\)/);
  assert.match(page, /window\.setInterval\(\(\) => void synchronizeActiveDpi\(\), 700\)/);
});

test("ships the product and social-preview artwork", async () => {
  await Promise.all([
    access(new URL("../public/a5-mouse.png", import.meta.url)),
    access(new URL("../public/og-epomaker.png", import.meta.url)),
    access(new URL("../public/about-me.html", import.meta.url)),
    access(new URL("../../docs/ADDING-A-MOUSE.md", import.meta.url)),
  ]);
});

test("builds and uploads the generated GitHub Pages directory", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /working-directory: web-driver-app/);
  assert.match(workflow, /run: npm run build:pages/);
  assert.match(workflow, /path: web-driver-app\/github-dist/);
  assert.doesNotMatch(workflow, /path:\s*['"]?\.['"]?/);
});
