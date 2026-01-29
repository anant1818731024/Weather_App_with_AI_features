import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLocation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Types for Open-Meteo responses (simplified for frontend usage)
export interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
    time: string;
    relative_humidity_2m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
  };
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

// === LOCATIONS (Favorites) ===
const getLocation = async () => {
      const res = await apiRequest("GET", api.locations.list.path, undefined, {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    }
export function useLocations() {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: getLocation,
  });
}

export function useAddLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLocation) => {
      const validated = api.locations.create.input.parse(data);
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to add location");
      const parsedRes = api.locations.create.responses[201].parse(await res.json());
      console.log("parsedResponse: ", parsedRes);
      return parsedRes;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.locations.list.path] }),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.locations.delete.path.slice(0, -4)+ "/" + id;
      const res = await apiRequest("DELETE", url, undefined, {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      });
      if (!res.ok) throw new Error("Failed to delete location");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.locations.list.path] }),
  });
}

// === WEATHER ===

export function useForecast(lat: number, lon: number) {
  return useQuery({
    queryKey: [api.weather.forecast.path, lat, lon],
    queryFn: async () => {
      if(!lat || !lon) throw new Error("Something went wrong");
      const url = `${api.weather.forecast.path}?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch forecast");
      // Typing this loosely as the Open-Meteo response structure is complex
      // In a real production app, we would have a strict Zod schema for this too
      const response = await res.json();
      return response as WeatherData;
    },
    enabled: !!lat && !!lon,
  });
}

export function useSearchCities(query: string) {
  return useQuery({
    queryKey: [api.weather.search.path, query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const url = `${api.weather.search.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search cities");
      const data = await res.json();
      return (data.results || []) as GeocodingResult[];
    },
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 5, // Cache search results for 5 mins
  });
}
