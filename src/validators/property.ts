import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

/**
 * Create: klienten ska INTE skicka owner_id.
 * Använd z.coerce.number() så att "2500" (string från Postman/JSON) blir 2500.
 */
export const createPropertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  price_per_night: z.coerce.number().int().nonnegative(),
  is_active: z.coerce.boolean().default(true),
});

export const createPropertyValidator = zValidator(
  "json",
  createPropertySchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
  }
);

/**
 * Update: partial så du kan PATCH/PUT valfria fält.
 * Fortfarande ingen owner_id från klienten.
 */
export const updatePropertySchema = createPropertySchema.partial();

export const updatePropertyValidator = zValidator(
  "json",
  updatePropertySchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
  }
);

// Hjälptyper om du vill ha dem i TS
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;