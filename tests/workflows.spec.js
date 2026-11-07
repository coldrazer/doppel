import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
async function open(page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Preview", exact: true }),
  ).toBeVisible();
}
test("creator uploads, places a target, edits, reorders, persists and publishes", async ({
  page,
  context,
}) => {
  await open(page);
  await page.getByRole("button", { name: "New walkthrough" }).click();
  await page.getByRole("button", { name: "Start fresh" }).click();
  await page.getByLabel("Walkthrough title").fill("QA onboarding");
  await page
    .getByLabel("What should someone learn?")
    .fill("Create an expense.");
  await page
    .getByLabel("Upload screenshots")
    .setInputFiles([
      path.join(root, "public/demo/step-1.png"),
      path.join(root, "public/demo/step-2.png"),
    ]);
  await expect(page.locator(".step-row")).toHaveCount(2);
  await page.getByLabel("Step title", { exact: true }).fill("Find the button");
  await page
    .getByRole("textbox", { name: "Instruction", exact: true })
    .fill("Click New expense.");
  await page
    .getByRole("button", { name: "Click here to place a target" })
    .click();
  const box = await page.locator(".editor-screen").boundingBox();
  await page.mouse.click(box.x + box.width * 0.83, box.y + box.height * 0.13);
  await page.getByRole("button", { name: "Move step later" }).click();
  await expect(page.locator(".step-row").last()).toContainText(
    "Find the button",
  );
  await expect(
    page.getByText("Changes saved locally", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Walkthrough title")).toHaveValue(
    "QA onboarding",
  );
  await expect(page.locator(".step-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ready for a practice run." }),
  ).toBeVisible();
  const link = await page.getByLabel("Walkthrough link").inputValue();
  const viewer = await context.newPage();
  await viewer.goto(link);
  await expect(
    viewer.getByRole("heading", { name: "QA onboarding" }),
  ).toBeVisible();
  for (let i = 0; i < 2; i++) await viewer.locator(".target").click();
  await expect(
    viewer.getByRole("heading", { name: "You’ve got this." }),
  ).toBeVisible();
});
test("learner gets corrective guidance, completes steps, and restarts", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator(".player-screen").click({ position: { x: 20, y: 20 } });
  await expect(page.locator(".feedback")).toContainText("upper-right");
  await expect(page.locator(".target")).toHaveClass(/revealed/);
  for (let i = 0; i < 3; i++) await page.locator(".target").click();
  await expect(
    page.getByRole("heading", { name: "You’ve got this." }),
  ).toBeVisible();
  await expect(page.locator(".completion-stats")).toContainText(
    "1 learning moments",
  );
  await page.getByRole("button", { name: "Practice again" }).click();
  await expect(
    page.getByRole("heading", { name: "Open expenses" }),
  ).toBeVisible();
});
test("export is self-contained, safe against embedded markup, and playable offline", async ({
  page,
  browser,
}, testInfo) => {
  await open(page);
  await page
    .getByLabel("Walkthrough title")
    .fill("</script><script>window.pwned=true</script>");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML" }).click();
  const download = await downloadEvent;
  const file = testInfo.outputPath("walkthrough.html");
  await download.saveAs(file);
  const offline = await browser.newContext({ offline: true });
  const viewer = await offline.newPage();
  await viewer.goto("file://" + file);
  await expect(viewer.locator("#title")).toContainText("window.pwned");
  expect(await viewer.evaluate(() => window.pwned)).toBeUndefined();
  await expect(viewer.locator("#image")).toHaveJSProperty("complete", true);
  for (let i = 0; i < 3; i++) await viewer.locator("#target").click();
  await expect(
    viewer.getByRole("heading", { name: "You’ve got this." }),
  ).toBeVisible();
  await offline.close();
});
test("AI success applies suggestions and provider failure preserves the draft", async ({
  page,
}) => {
  await page.route("**/api/analyze", async (route) => {
    const req = route.request().postDataJSON();
    await route.fulfill({
      json: {
        steps: req.images.map(() => ({
          title: "AI suggested step",
          instruction: "Click the action.",
          hint: "Look near the top.",
          target: { x: 0.7, y: 0.1, w: 0.2, h: 0.1 },
        })),
      },
    });
  });
  await open(page);
  await page.getByRole("button", { name: "Generate with AI" }).click();
  await expect(page.getByLabel("Step title", { exact: true })).toHaveValue(
    "AI suggested step",
  );
  await page.unroute("**/api/analyze");
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "Provider temporarily unavailable." },
    }),
  );
  await page.getByRole("button", { name: "Generate with AI" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Provider temporarily unavailable",
  );
  await expect(page.getByLabel("Step title", { exact: true })).toHaveValue(
    "AI suggested step",
  );
});
test("mobile editor and learner have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Show me a hint" }).click();
  await expect(page.locator(".target")).toHaveClass(/revealed/);
});
test("server rejects unsafe data and cross-origin mutations", async ({
  request,
}) => {
  const r = await request.post("/api/walkthroughs", {
    data: { title: "Invalid", steps: [] },
  });
  expect(r.status()).toBe(400);
  const cross = await request.post("/api/analyze", {
    headers: { Origin: "https://untrusted.example" },
    data: {},
  });
  expect(cross.status()).toBe(403);
  const missing = await request.get("/api/walkthroughs/no-such-id");
  expect(missing.status()).toBe(404);
});
