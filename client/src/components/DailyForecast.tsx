import { type WeatherData } from "@/hooks/use-weather";
import { WeatherIcon } from "./WeatherIcon";
import { format } from "date-fns";

interface DailyForecastProps {
  data: WeatherData;
}

export function DailyForecast({ data }: DailyForecastProps) {
  const daily = data.daily;
  
  // We want to show the next 5 days (skipping today usually, but let's just show 5 from array)
  // The API returns 7 days typically
  const daysToDisplay = 5;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 px-1">5-Day Forecast</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {daily.time.slice(1, daysToDisplay + 1).map((time, index) => {
          // Adjusted index because we sliced starting from 1
          const realIndex = index + 1;
          const date = new Date(time);
          
          return (
            <div 
              key={time} 
              className="glass-card rounded-2xl p-4 flex flex-col items-center justify-between gap-4 text-center group"
            >
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {format(date, "EEE")}
              </span>
              
              <div className="p-3 bg-white/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                <WeatherIcon 
                  code={daily.weather_code[realIndex]} 
                  className="w-8 h-8" 
                />
              </div>
              
              <div className="w-full flex justify-between items-center px-2 text-sm font-medium">
                <span className="text-foreground/80">{Math.round(daily.temperature_2m_max[realIndex])}°</span>
                <span className="w-full h-1 bg-gradient-to-r from-blue-300/30 to-orange-300/30 mx-2 rounded-full"></span>
                <span className="text-muted-foreground">{Math.round(daily.temperature_2m_min[realIndex])}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
