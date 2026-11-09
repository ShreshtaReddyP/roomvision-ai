import { useEffect, useState } from "react";

const read = () => window.location.hash.replace(/^#/, "") || "/";

/** A tiny router: "#/design" -> "/design". Works on static hosting without extra rewrite rules. */
export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = path;
}
