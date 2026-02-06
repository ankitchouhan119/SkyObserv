

import { z } from "zod";

export function toJsonSchema(schema: z.ZodTypeAny): any {
  // For now, we'll return the zod schema directly
  // TamboAI's react library should handle Zod schemas natively
  return schema;
}
