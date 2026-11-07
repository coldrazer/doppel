export const seed = {
  title: "Submit your first expense",
  goal: "Learn how to create and submit an expense for review in Orbit.",
  steps: [
    {
      id: "demo-1",
      image: "/demo/step-1.png",
      title: "Open expenses",
      instruction: "Click New expense to get started.",
      hint: "Look in the upper-right corner of the Expenses page.",
      target: { x: 0.79, y: 0.092, w: 0.17, h: 0.085 },
    },
    {
      id: "demo-2",
      image: "/demo/step-2.png",
      title: "Create an expense",
      instruction:
        "Your expense details are filled in. Click Continue to review them.",
      hint: "The Continue button sits at the bottom of the expense form.",
      target: { x: 0.39, y: 0.79, w: 0.38, h: 0.075 },
    },
    {
      id: "demo-3",
      image: "/demo/step-3.png",
      title: "Submit for review",
      instruction: "Everything looks good. Click Submit for review to finish.",
      hint: "Look for the purple button below the expense summary.",
      target: { x: 0.39, y: 0.75, w: 0.38, h: 0.075 },
    },
  ],
};
export const blank = { title: "Untitled walkthrough", goal: "", steps: [] };
export async function api(url, options = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Request failed.");
  return j;
}
export async function readScreenshot(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Use PNG, JPG, or WebP screenshots.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Each screenshot must be under 15 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return {
    id: crypto.randomUUID(),
    image: canvas.toDataURL("image/jpeg", 0.88),
    title: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "New step",
    instruction: "Click the highlighted target to continue.",
    hint: "Look for the highlighted area on this screen.",
    target: { x: 0.4, y: 0.4, w: 0.2, h: 0.1 },
  };
}
