import assert from "node:assert/strict";
import { access } from "node:fs/promises";
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
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships the product and social-preview artwork", async () => {
  await Promise.all([
    access(new URL("../public/a5-mouse.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});

