import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CurrentWeather } from "@/components/CurrentWeather";
import { DailyForecast } from "@/components/DailyForecast";
import { SavedLocations } from "@/components/SavedLocations";
import { useForecast, useAddLocation, type GeocodingResult } from "@/hooks/use-weather";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Star, LogOut, User as UserIcon, Settings } from "lucide-react";
import { type Location } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { WeatherChat } from "@/components/WeatherChat";
import { AiFillRobot } from "react-icons/ai";
import { useViewport } from "@/hooks/use-viewport";

// Default location (New York)
const DEFAULT_LOC: any = {
  name: "Delhi",
  latitude: 28.65195,
  longitude: 77.23149,
  country: "India",
  admin1: "Delhi"
};

export default function Home() {
  const { user, logoutMutation } = useAuth();
  const [activeLocation, setActiveLocation] = useState<GeocodingResult | Location>(DEFAULT_LOC);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);

  const { vw } = useViewport();

  
  const { data: weather, isLoading, error } = useForecast(activeLocation.latitude, activeLocation.longitude);
  const addLocationMutation = useAddLocation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && locationExists(user.id, activeLocation.latitude, activeLocation.longitude)) {
      setIsFavorite(true);
    } else {
      setIsFavorite(false);
    }
  }, [activeLocation, user, weather]);

  useEffect(() => {
    if (isBotOpen && vw < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // cleanup in case component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBotOpen, vw]);

  const handleLocationSelect = (loc: GeocodingResult | Location) => {
    setActiveLocation(loc);
  };

  function locationExists(
    userId: number,
    latitude: number,
    longitude: number
  ) {
    const locations =
      queryClient.getQueryData<Location[]>(["/api/locations"]) ?? [];
    const location = locations.some(
      (loc) =>
        loc.userId === userId &&
        loc.latitude === latitude &&
        loc.longitude === longitude
    );
    return location;
  }


  const handleSaveLocation = async () => {
    if(!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "Please log in to save locations.",
      });
      setLocation("/auth");
      return;
    }
    try {
      const exists = locationExists(
        user!.id,
        activeLocation.latitude,
        activeLocation.longitude
      );

      if (exists) {
        throw new Error("Location already exists");
      }
      await addLocationMutation.mutateAsync({
        name: activeLocation.name,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        country: activeLocation.country || null,
        admin1: activeLocation.admin1 || null,
        userId: user!.id,
      });
      setIsFavorite(true);
      toast({
        title: "Location Saved",
        description: `${activeLocation.name} has been added to your favorites.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save location.",
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 font-sans text-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8">
        
        {/* Sidebar / Top bar on mobile */}
        <div className="space-y-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.8-3.2-3.7-5.6-7.1-5.6H6c-3.3 0-6 2.7-6 6s2.7 6 6 6h11.5c1.9 0 3.5-1.6 3.5-3.5Z"/><path d="M22 10.5V6a2 2 0 0 0-2-2h-3l-2.5-3H9.5L7 4H4a2 2 0 0 0-2 2v2"/><path d="M16 10a4 4 0 0 0-4-4"/></svg>
              </div>
              <h1 className="gap-2 lg:gap-4 flex justify-between text-2xl font-bold font-display tracking-tight text-foreground">
                <span className="inline-flex items-center">Atmosphere</span> 
                {!user && <span ><button onClick={() => setLocation("/auth")} className="ml-[30px] text-primary font-semibold underline underline-offset-4">
                  Login/Sign up
                </button>
                </span>}
              </h1>
            </div>
            
            {user && <div className="flex items-center gap-4 lg:mt-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                <span>{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/profile")}
                title="Profile Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logoutMutation.mutate()}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>}
          </header>

          <SearchBar onSelectLocation={handleLocationSelect} />


        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="h-[400px] flex flex-col items-center justify-center glass-panel rounded-3xl animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin text-primary/50 mb-4" />
              <p className="text-muted-foreground">Forecasting the future...</p>
            </div>
          ) : error ? (
            <div className="h-[400px] flex flex-col items-center justify-center glass-panel rounded-3xl border-destructive/20 bg-destructive/5">
              <p className="text-destructive font-bold text-lg mb-2">Failed to load weather data</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : weather ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end mb-4 lg:hidden">
                 {/* Only show "Add to Favorites" button on mobile here, usually inside header or somewhere accessible */}
                 {!isFavorite && (
                  <button
                    onClick={handleSaveLocation}
                    disabled={addLocationMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-full text-sm font-medium text-primary transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    Save Location
                  </button>
                 )}
              </div>

              <div className="relative group">
                {/* Desktop Save Button overlay */}
                <div className="absolute top-4 right-6 z-20 hidden lg:block">
                   <button
                    onClick={handleSaveLocation}
                    disabled={addLocationMutation.isPending || isFavorite}
                    className={`
                      relative bottom-1 p-3 rounded-full transition-all duration-300 shadow-sm
                      ${isFavorite 
                        ? "bg-yellow-400 text-yellow-900 cursor-default" 
                        : "bg-white/20 hover:bg-white/40 text-foreground backdrop-blur-md"
                      }
                    `}
                    title="Save to favorites"
                  >
                    <Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>

                <CurrentWeather 
                  data={weather} 
                  locationName={activeLocation.name} 
                />
              </div>

              <DailyForecast data={weather} />
            </div>
          ) : null}

          {user && <div className="mt-12 pt-8 border-t border-black/5">
            <h3 className="font-bold text-lg mb-4">Saved Locations</h3>
            <SavedLocations 
              onSelect={handleLocationSelect}
              currentLocationId={'id' in activeLocation ? activeLocation.id : undefined}
              setIsFavorite={setIsFavorite}
              activeLocation={activeLocation}
            />
          </div>}
        </div>
      </div>
      {weather && (
  <>
    {/* Floating Bot Button */}
    <button
      onClick={() => setIsBotOpen((v) => !v)}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        px-5 py-3 rounded-full
        bg-primary text-primary-foreground
        shadow-xl hover:scale-105 active:scale-95
        transition-all
      "
    >
      <AiFillRobot className="w-5 h-5" />
      <span className="hidden md:inline font-semibold">
        Weather Assistant
      </span>
    </button>

          {/* Floating Chat */}
          <WeatherChat
            weather={{
              location: activeLocation.name,
              timestamp: new Date().toString(),
            }}
            open={isBotOpen}
            onClose={() => setIsBotOpen(false)}
          />
        </>
      )}

    </div>
  );
}
