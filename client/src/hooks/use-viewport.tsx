import { useEffect, useState } from "react";

export function useViewport() {
  const [vh, setVh] = useState<number>(window.innerHeight);
  const [vw, setVw] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setVh(window.innerHeight);
      setVw(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // mobile browsers fire orientationchange separately
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return { vh, vw };
}
