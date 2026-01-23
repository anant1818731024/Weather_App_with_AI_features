import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as auth from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Locations API
  app.get(api.locations.list.path, async (req, res) => {
    const userId = Number(req.params.userId);

    if (Number.isNaN(userId)) {
      res.status(400).json({ message: "Invalid userId" });
    }
    const locations = await storage.getLocations(userId);
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.delete(api.locations.delete.path, async (req, res) => {
    const id = parseInt(req.params.id as string);
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId) || isNaN(id)) {
      return res.status(400).json({ message: "location not found" });
    }
    await storage.deleteLocation(id, userId);
    res.status(204).end();
  });

  // Weather Proxy API (Open-Meteo)
  app.get(api.weather.search.path, async (req, res) => {
    try {
      const { q } = api.weather.search.input.parse(req.query);
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
      );
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch geocoding data" });
    }
  });

  app.get(api.weather.forecast.path, async (req, res) => {
    try {
      const { lat, lon } = api.weather.forecast.input.parse(req.query);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  app.post(api.auth.register.path, auth.register);
  app.post(api.auth.login.path, auth.login);
  app.get(api.auth.me.path, auth.authMiddleware, auth.me);
  app.post(api.changePassword.path, auth.authMiddleware, auth.changePassword);
  app.post(api.auth.logout.path, auth.authMiddleware, auth.logout);

  return httpServer;
}


