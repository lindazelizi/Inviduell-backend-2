import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const propertySchema = z.object({
  owner_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  price_per_night: z.number().int().nonnegative(),
  is_active: z.boolean().optional().default(true),
});

export const createPropertyValidator = zValidator("json", propertySchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.flatten() }, 400);
  }
});