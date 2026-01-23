import { z } from 'zod';
import { changePasswordSchema, insertLocationSchema, locations, loginSchema, publicUserSchema, registerSchema } from './schema';
import { log } from 'console';
import path from 'path';

export const api = {
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations/:userId',
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
      path: '/api/locations/:id/:userId',
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

  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: registerSchema,
      responses: {
        201: publicUserSchema,
        400: z.object({ message: z.string() }),
      },
    },

    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: loginSchema,
      responses: {
        200: z.object({ token: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },

    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: publicUserSchema,
        401: z.object({ message: z.string() }),
      },
    }, logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },

  changePassword: {
    method: "POST" as const,
    path: "/api/auth/change-password",
    input: changePasswordSchema,
    responses: {
      200: z.object({ message: z.string() }),
      401: z.object({ message: z.string() }),
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
