import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset scroll on client navigation (better UX for long pages). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
