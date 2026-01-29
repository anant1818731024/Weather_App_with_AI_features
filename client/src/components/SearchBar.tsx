import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useSearchCities, type GeocodingResult } from "@/hooks/use-weather";

interface SearchBarProps {
  onSelectLocation: (loc: GeocodingResult) => void;
  padding?: { top: string; bottom: string; left: string; right: string };
  style?: React.CSSProperties;
}

export function SearchBar({ onSelectLocation, padding, style }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Simple debounce
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: results, isLoading } = useSearchCities(debouncedQuery);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: GeocodingResult) => {
    onSelectLocation(loc);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full" style={style}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder="Search for a city..."
          className="h-[49.8px] shadow-sm bg-background w-full rounded-xl px-4 py-6 backdrop-blur-md border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-lg placeholder:text-muted-foreground/70"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style = {{
            paddingTop: padding?.top,
            paddingBottom: padding?.bottom,
            paddingLeft: padding?.left,
            paddingRight: padding?.right,
          }}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results && results.length > 0 && (
        <div className="z-40 absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-xl border border-white/50 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <ul className="divide-y divide-black/5">
            {results.map((city) => (
              <li key={city.id}>
                <button
                  onClick={() => handleSelect(city)}
                  className="w-full px-5 py-3 flex items-start text-left hover:bg-primary/5 transition-colors group"
                >
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" />
                  <div>
                    <span className="font-semibold text-foreground block">{city.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {[city.admin1, city.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && query.length > 2 && results && results.length === 0 && !isLoading && (
        <div className="z-40 absolute top-full left-0 right-0 mt-2 p-4 text-center bg-white/90 backdrop-blur-xl rounded-xl border border-white/50 shadow-xl text-muted-foreground">
          No locations found
        </div>
      )}
    </div>
  );
}
