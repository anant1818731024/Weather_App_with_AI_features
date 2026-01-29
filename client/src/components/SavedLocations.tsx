import Select from "react-select";
import { Loader2 } from "lucide-react";
import { useLocations } from "@/hooks/use-weather";
import { type Location } from "@shared/schema";
import { useEffect, useMemo } from "react";

interface SavedLocationsProps {
  onSelect: (location: Location) => void;
  currentLocation?: Location;
}

export function SavedLocations({
  onSelect,
  currentLocation,
}: SavedLocationsProps) {
  const { data: locations, isLoading } = useLocations();

  useEffect(() => {
    console.log("currentLocation:", currentLocation);
  }, [currentLocation]);

    /** react-select options */
  const options = useMemo(
    () =>
      locations?.map((loc) => ({
        value: loc.id.toString(),
        label: loc.name,
        location: loc,
      })),
    [locations]
  );

  /** selected value */
  const selectedValue = useMemo(() => {
    if (!currentLocation) return null;
    return options?.find(
      (opt) => opt.value === currentLocation.id?.toString()
    ) ?? null;
  }, [currentLocation, options]);

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <Select
      options={options}
      value={selectedValue}
      placeholder="Select a saved location ---"
      onChange={(option) => {
        if (option) {
          onSelect(option.location);
        }
      }}
      getOptionLabel={(option) => (
        `${option.location.name}${
          option.location.admin1 || option.location.country
            ? ` • ${[option.location.admin1, option.location.country]
                .filter(Boolean)
                .join(", ")}`
            : ""
        }`
      )}
      className="w-full"
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: "0.75rem",
          minHeight: "3rem",
          paddingLeft: "0.25rem",
        }),
      }}
    />
  );
}
