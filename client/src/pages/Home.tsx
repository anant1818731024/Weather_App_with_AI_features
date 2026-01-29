import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CurrentWeather } from "@/components/CurrentWeather";
import { DailyForecast } from "@/components/DailyForecast";
import { SavedLocations } from "@/components/SavedLocations";
import { type GeocodingResult } from "@/hooks/use-weather";
import { type Location } from "@shared/schema";

// Default location (New York)
const DEFAULT_LOC: any = {
  name: "Delhi",
  latitude: 28.65195,
  longitude: 77.23149,
  country: "India",
  admin1: "Delhi"
};

export default function Home() {
  const [activeLocation, setActiveLocation] = useState<GeocodingResult | Location>(DEFAULT_LOC);

  const handleLocationSelect = (loc: GeocodingResult | Location) => {
    setActiveLocation(loc);
  };

  useEffect(() => {
    console.log("activeLocation: ", activeLocation);
  }, [activeLocation])

  return (
    <div className="p-4 md:p-8 lg:p-12 md:pt-4 lg:pt-4 font-sans text-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-1">

        {/* Main Content Area */}
            <div className="space-y-6 lg:col-span-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <SearchBar onSelectLocation={handleLocationSelect}/>
                <SavedLocations
                  onSelect={handleLocationSelect}
                  currentLocation={activeLocation}
                />
              </div>
              <CurrentWeather 
                  location={activeLocation} 
                />
              <DailyForecast location={activeLocation} />
            </div> 
        </div>
    </div>
  );
}
