import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Moon,
  CloudMoon
} from "lucide-react";

interface WeatherIconProps {
  code: number;
  isDay?: number; // 1 for day, 0 for night
  className?: string;
}

export function WeatherIcon({ code, isDay = 1, className = "w-6 h-6" }: WeatherIconProps) {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  
  // Clear sky
  if (code === 0) {
    return isDay ? <Sun className={`text-orange-500 ${className}`} /> : <Moon className={`text-blue-200 ${className}`} />;
  }

  // Mainly clear, partly cloudy, and overcast
  if (code === 1 || code === 2) {
    return isDay ? <CloudSun className={`text-orange-400 ${className}`} /> : <CloudMoon className={`text-blue-300 ${className}`} />;
  }
  
  if (code === 3) {
    return <Cloud className={`text-gray-400 ${className}`} />;
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return <CloudFog className={`text-slate-400 ${className}`} />;
  }

  // Drizzle
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className={`text-blue-400 ${className}`} />;
  }

  // Rain
  if (code >= 61 && code <= 67) {
    return <CloudRain className={`text-blue-500 ${className}`} />;
  }
  
  // Snow
  if (code >= 71 && code <= 77) {
    return <CloudSnow className={`text-cyan-200 ${className}`} />;
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return <CloudRain className={`text-blue-400 ${className}`} />;
  }

  // Snow showers
  if (code >= 85 && code <= 86) {
    return <CloudSnow className={`text-cyan-300 ${className}`} />;
  }

  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return <CloudLightning className={`text-purple-500 ${className}`} />;
  }

  return <Sun className={`text-orange-500 ${className}`} />;
}
