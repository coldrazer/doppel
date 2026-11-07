import test from "node:test";
import assert from "node:assert/strict";
import { walkthroughSchema, targetSchema, parseAnalysis } from "../schema.mjs";
import { seed } from "../src/data.js";
test("valid walkthrough and normalized targets are accepted", () =>
  assert.ok(walkthroughSchema.safeParse(seed).success));
test("out-of-bounds targets cannot be published", () => {
  assert.equal(
    targetSchema.safeParse({ x: 0.9, y: 0.1, w: 0.2, h: 0.1 }).success,
    false,
  );
  assert.equal(
    targetSchema.safeParse({ x: 0, y: 0, w: 0, h: 0.1 }).success,
    false,
  );
});
test("external and active-content image sources are rejected", () => {
  for (const image of [
    "https://evil.test/image.png",
    "data:image/svg+xml;base64,AAAA",
    "javascript:alert(1)",
    "/demo/../../.env.local",
  ])
    assert.equal(
      walkthroughSchema.safeParse({
        ...seed,
        steps: [{ ...seed.steps[0], image }],
      }).success,
      false,
    );
});
test("model output must include exactly one valid step per screenshot", () => {
  const steps = seed.steps.map(({ id, image, ...s }) => s);
  assert.equal(
    parseAnalysis("```json\n" + JSON.stringify({ steps }) + "\n```", 3).steps
      .length,
    3,
  );
  assert.throws(() => parseAnalysis(JSON.stringify({ steps }), 2));
  assert.throws(() => parseAnalysis('{"steps":[{"target":{"x":-1}}]}', 1));
});
