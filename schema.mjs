import { z } from "zod";
export const targetSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0.01).max(1),
    h: z.number().min(0.01).max(1),
  })
  .refine(
    (t) => t.x + t.w <= 1.001 && t.y + t.h <= 1.001,
    "Target must fit inside screenshot",
  );
export const imageSchema = z
  .string()
  .max(5_000_000)
  .regex(
    /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|\/demo\/step-[123]\.png)$/,
  );
export const stepSchema = z.object({
  id: z.string().min(1).max(100),
  image: imageSchema,
  title: z.string().trim().min(1).max(120),
  instruction: z.string().trim().min(1).max(800),
  hint: z.string().max(800).default("Look for the highlighted target."),
  target: targetSchema,
});
export const walkthroughSchema = z.object({
  title: z.string().trim().min(1).max(160),
  goal: z.string().trim().min(1).max(1000),
  steps: z.array(stepSchema).min(1).max(12),
});
export const analysisSchema = z.object({
  goal: z.string().trim().min(1).max(1000),
  images: z.array(imageSchema).min(1).max(12),
});
export function parseAnalysis(content, count) {
  const raw = content
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  const json = JSON.parse(
    raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
  );
  return z
    .object({
      steps: z.array(stepSchema.omit({ id: true, image: true })).length(count),
    })
    .parse(json);
}
