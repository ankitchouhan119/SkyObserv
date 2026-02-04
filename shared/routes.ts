import { z } from 'zod';
import { insertUserPreferenceSchema, userPreferences } from './schema';

export const api = {
  // Proxy endpoint for SkyWalking GraphQL
  // We proxy to avoid CORS and allow server-side URL configuration
  graphql: {
    proxy: {
      method: 'POST' as const,
      path: '/graphql',
      input: z.object({
        query: z.string(),
        variables: z.record(z.any()).optional(),
      }),
      responses: {
        200: z.any(), // GraphQL response
        500: z.object({ message: z.string() }),
      },
    },
  },
  // Persistence for dashboard preferences
  preferences: {
    get: {
      method: 'GET' as const,
      path: '/preferences/:key',
      responses: {
        200: z.custom<typeof userPreferences.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    save: {
      method: 'POST' as const,
      path: '/preferences',
      input: insertUserPreferenceSchema,
      responses: {
        200: z.custom<typeof userPreferences.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
