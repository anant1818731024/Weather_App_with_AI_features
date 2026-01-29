import { GeocodingResult, useForecast } from "@/hooks/use-weather";
import { WeatherIcon } from "./WeatherIcon";
import { format } from "date-fns";
import { Location } from "@shared/schema";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard, Mousewheel } from "swiper/modules";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import "swiper/css";



interface DailyForecastProps {
  location: GeocodingResult | Location;
}

export function DailyForecast({ location }: DailyForecastProps) {
  const { data, isLoading } = useForecast(
    location.latitude,
    location.longitude
  );

  const daily = data?.daily;
  const daysToDisplay = 5;

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (isLoading) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center glass-panel rounded-3xl">
        <Loader2 className="w-10 h-10 animate-spin text-primary/50 mb-4" />
        <p className="text-muted-foreground">Forecasting the future…</p>
      </div>
    );
  }

  if (!daily) return null;

  return (
    <div className="w-full">
      {/* Header + navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-lg font-semibold">5-Day Forecast</h3>

        <div className="flex gap-2">
          <button
            ref={prevRef}
            className="h-8 w-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            ref={nextRef}
            className="h-8 w-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Keyboard, Mousewheel]}
        onBeforeInit={(swiper) => {
          // @ts-ignore
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-ignore
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        navigation
        keyboard={{ enabled: true }}
        mousewheel={{ forceToAxis: true }}
        spaceBetween={12}
        breakpoints={{
          0: { slidesPerView: 1.4 },
          640: { slidesPerView: 2.5 },
          768: { slidesPerView: 3.5 },
          1024: { slidesPerView: 5 },
        }}
        className="pb-2"
      >
        {daily.time.slice(1, daysToDisplay + 1).map((time, index) => {
          const realIndex = index + 1;
          const date = new Date(time);

          return (
            <SwiperSlide key={time}>
              {/* SMALLER CARD */}
              <div className="glass-card rounded-2xl p-3 h-full flex flex-col items-center justify-between gap-3 text-center transition hover:scale-[1.02]">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {format(date, "EEE")}
                </span>

                <div className="p-2 bg-white/40 rounded-full">
                  <WeatherIcon
                    code={daily.weather_code[realIndex]}
                    className="w-7 h-7"
                  />
                </div>

                <div className="w-full flex items-center justify-between text-xs font-medium">
                  <span>
                    {Math.round(daily.temperature_2m_max[realIndex])}°
                  </span>

                  <span className="flex-1 h-0.5 mx-2 rounded-full bg-gradient-to-r from-blue-400/30 to-orange-400/30" />

                  <span className="text-muted-foreground">
                    {Math.round(daily.temperature_2m_min[realIndex])}°
                  </span>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}


