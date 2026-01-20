import { type WeatherData, type GeocodingResult } from "@/hooks/use-weather";
import { WeatherIcon } from "./WeatherIcon";
import { Wind, Droplets, ArrowUp, ArrowDown } from "lucide-react";

interface CurrentWeatherProps {
  data: WeatherData;
  locationName: string;
}

export function CurrentWeather({ data, locationName }: CurrentWeatherProps) {
  console.log("CurrentWeather data:", data);
  const current = data.current;
  const today = data.daily;

  // Format current date
  const date = new Date(current?.time);
  const dateStr = !isNaN(date.getTime()) 
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(date)
    : "";

  return (
    <div className="glass-panel rounded-3xl p-8 md:p-12 text-center md:text-left relative overflow-hidden group">
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            {locationName}
          </h2>
          <p className="text-lg text-muted-foreground font-medium">{dateStr}</p>

          <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
            <div className="bg-white/50 p-4 rounded-2xl shadow-sm border border-white/40">
              <WeatherIcon
                code={current.weather_code}
                isDay={current.is_day}
                className="w-16 h-16"
              />
            </div>
            <div className="text-left">
              <div className="text-6xl md:text-7xl font-bold font-display tracking-tighter text-foreground">
                {Math.round(current.temperature_2m)}°
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <StatCard
            icon={<Wind className="w-5 h-5 text-blue-500" />}
            label="Wind"
            value={`${current.wind_speed_10m} km/h`}
          />
          <StatCard
            icon={<Droplets className="w-5 h-5 text-cyan-500" />}
            label="Precip"
            value={`${today?.precipitation_sum?.[0] || 0} mm`}
          />
          <StatCard
            icon={<ArrowUp className="w-5 h-5 text-orange-500" />}
            label="High"
            value={`${Math.round(today.temperature_2m_max[0])}°`}
          />
          <StatCard
            icon={<ArrowDown className="w-5 h-5 text-blue-400" />}
            label="Low"
            value={`${Math.round(today.temperature_2m_min[0])}°`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/40 border border-white/40 p-4 rounded-xl flex flex-col items-center md:items-start min-w-[100px]">
      <div className="flex items-center gap-2 mb-1 opacity-70">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}
