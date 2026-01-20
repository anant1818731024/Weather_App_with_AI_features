import { z } from 'zod';
import { insertLocationSchema, locations } from './schema';

export const api = {
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations',
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/locations',
      input: insertLocationSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/locations/:id',
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  weather: {
    forecast: {
      method: 'GET' as const,
      path: '/api/weather/forecast',
      input: z.object({
        lat: z.coerce.number(),
        lon: z.coerce.number(),
      }),
      responses: {
        200: z.any(), // Returns Open-Meteo weather data structure
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/weather/search',
      input: z.object({
        q: z.string(),
      }),
      responses: {
        200: z.any(), // Returns geocoding results
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
