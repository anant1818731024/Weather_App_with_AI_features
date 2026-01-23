import { useLocations, useDeleteLocation } from "@/hooks/use-weather";
import { type Location } from "@shared/schema";
import { Trash2, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedLocationsProps {
  onSelect: (location: Location) => void;
  currentLocationId?: number;
  setIsFavorite: (isFav: boolean) => void;
  activeLocation: Location | any;
}

export function SavedLocations({ activeLocation, setIsFavorite, onSelect, currentLocationId }: SavedLocationsProps) {
  const { data: locations, isLoading } = useLocations();
  const deleteMutation = useDeleteLocation();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent, loc: Location) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(loc.id);
      if (activeLocation && activeLocation.latitude === loc.latitude && activeLocation.longitude === loc.longitude) {
        setIsFavorite(false);
      }
      toast({
        title: "Removed",
        description: `${loc.name} has been removed from favorites.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove location.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-primary/10 rounded-2xl bg-white/30">
        <MapPin className="w-8 h-8 mx-auto text-primary/30 mb-3" />
        <p className="text-muted-foreground font-medium">No saved locations yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Search for a city to add it</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {locations.map((loc) => (
        <div
          key={loc.id}
          onClick={() => onSelect(loc)}
          className={`
            group relative flex items-center justify-between p-4 rounded-xl cursor-pointer
            border transition-all duration-200
            ${loc.id === currentLocationId 
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]" 
              : "bg-white/60 hover:bg-white border-white/40 hover:border-white shadow-sm hover:shadow-md"
            }
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`
              p-2 rounded-lg
              ${loc.id === currentLocationId ? "bg-white/20" : "bg-primary/10 text-primary"}
            `}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h4 className="font-semibold truncate">{loc.name}</h4>
              <p className={`text-xs truncate ${loc.id === currentLocationId ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {[loc.admin1, loc.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {loc.id === currentLocationId && (
              <ChevronRight className="w-5 h-5 opacity-50" />
            )}
            
            <button
              onClick={(e) => handleDelete(e, loc)}
              disabled={deleteMutation.isPending}
              className={`
                p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100
                ${loc.id === currentLocationId 
                  ? "hover:bg-white/20 text-white" 
                  : "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                }
              `}
              title="Remove from favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
