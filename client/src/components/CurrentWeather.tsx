import { type GeocodingResult, useForecast, useAddLocation, useDeleteLocation, useLocations } from "@/hooks/use-weather";
import { WeatherIcon } from "./WeatherIcon";
import { Wind, Droplets, ArrowUp, ArrowDown, Loader2, Star } from "lucide-react";
import type { Location } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface CurrentWeatherProps {
  location: GeocodingResult | Location;
}

export function CurrentWeather({ location }: CurrentWeatherProps) {
  const { user } = useAuth();
  const { data, isLoading, error } = useForecast(location.latitude, location.longitude);
  const addLocationMutation = useAddLocation();
  const deleteMutation = useDeleteLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const { data: locations, isLoading:isLoadingLocations } = useLocations();
  const current = data?.current;
  const today = data?.daily;

  // Format current date
  const date = new Date(current?.time || Date.now());
  const dateStr = !isNaN(date.getTime()) 
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(date)
    : "";
  

  function locationExists(
  ) {
    const ans =  locations?.some(
      (loc) =>
      {
        if(loc.latitude === location.latitude &&
        loc.longitude === location.longitude){
          location.id = loc.id;
          return true;
        }
      }
    );
    console.log("ans: ", ans);
    return ans;
  }

  useEffect(() => {
    if(locationExists()){
      setIsFavorite(true);
    }else{
      setIsFavorite(false);
    }
  }, [location, locations])

  const handleSaveLocation = async () => {
      if(!user) {
        toast({
          variant: "destructive",
          title: "Not Logged In",
          description: "Please log in to save locations.",
        });
        return;
      }
      try {
        const exists = locationExists();
  
        if (exists) {
          throw new Error("Location already exists");
        }
        await addLocationMutation.mutateAsync({
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          country: location.country || null,
          admin1: location.admin1 || null,
          userId: user!.id,
        });
        toast({
          title: "Location Saved",
          description: `${location.name} has been added to your favorites.`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not save location.",
        });
      }
    }; 

  const handleUnsaveLocation = async () => {
    try {
      await deleteMutation.mutateAsync(location.id);

      toast({
        title: "Removed",
        description: `${location.name} has been removed from favorites.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove location.",
      });
    }
  };

  if (isLoading) return (
    <div className="h-[400px] flex flex-col items-center justify-center glass-panel rounded-3xl animate-pulse">
      <Loader2 className="w-10 h-10 animate-spin text-primary/50 mb-4" />
      <p className="text-muted-foreground">Forecasting the future...</p>
    </div>
  )

  if (error) return (
    <div className="h-[400px] flex flex-col items-center justify-center glass-panel rounded-3xl border-destructive/20 bg-destructive/5">
      <p className="text-destructive font-bold text-lg mb-2">Failed to load weather data</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Retry
      </button>
    </div>
  )

  console.log(addLocationMutation.isPending, deleteMutation.isPending);

  return (
    <div className="glass-panel rounded-3xl p-8 md:p-12 text-center md:text-left relative overflow-hidden group">
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
      <button
        onClick={isFavorite? handleUnsaveLocation: handleSaveLocation}
        disabled={addLocationMutation.isPending || deleteMutation.isPending}
        className={`${isFavorite && "text-yellow-600"} absolute top-4 right-5 flex items-center gap-2 rounded-full z-20 text-sm font-medium text-primary transition-colors`}
      >
        <Star className="w-6 h-6" fill = {isFavorite? "#FACC15": "none"} />
        {!isFavorite && <span className="hidden md:block">Save Location</span>}
        <Loader2 className={`w-4 h-4 ml-2 text-primary animate-spin ${addLocationMutation.isPending ? "block" : "hidden"}`} />
      </button>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            {location.name}
          </h2>
          <p className="text-lg text-muted-foreground font-medium">{dateStr}</p>

          <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
            <div className="bg-white/50 p-4 rounded-2xl shadow-sm border border-white/40">
              <WeatherIcon
                code={current?.weather_code || 0}
                isDay={current?.is_day}
                className="w-16 h-16"
              />
            </div>
            <div className="text-left">
              <div className="text-6xl md:text-7xl font-bold font-display tracking-tighter text-foreground">
                {Math.round(current?.temperature_2m || 0)}°
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <StatCard
            icon={<Wind className="w-5 h-5 text-blue-500" />}
            label="Wind"
            value={`${current?.wind_speed_10m} km/h`}
          />
          <StatCard
            icon={<Droplets className="w-5 h-5 text-cyan-500" />}
            label="Precip"
            value={`${today?.precipitation_sum?.[0] || 0} mm`}
          />
          <StatCard
            icon={<ArrowUp className="w-5 h-5 text-orange-500" />}
            label="High"
            value={`${Math.round(today?.temperature_2m_max[0] || 0)}°`}
          />
          <StatCard
            icon={<ArrowDown className="w-5 h-5 text-blue-400" />}
            label="Low"
            value={`${Math.round(today?.temperature_2m_min[0] || 0)}°`}
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
