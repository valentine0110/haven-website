import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Runs an async fetcher on mount (and whenever deps change), tracking
 * loading/error state. Call `refetch()` after a mutation (save/delete) to
 * pull fresh data instead of trying to patch local state by hand.
 */
export function useAsync(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => { if (active) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (active) setState({ data: null, loading: false, error }); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => load(), [load]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

/**
 * Debounce a value by `delay` ms. Useful for search inputs.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Observe when an element enters the viewport.
 * Returns [ref, isVisible]. Once visible, stays true (no re-trigger).
 */
export function useIntersection(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px", ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return [ref, isVisible];
}

/**
 * Track scroll position for header effects, progress bars, etc.
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(y);
      setScrollProgress(max > 0 ? Math.min(y / max, 1) : 0);
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { scrollY, scrollProgress };
}

/**
 * Animate a number counting up from 0 to `target` when `active` becomes true.
 */
export function useCountUp(target, active, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target <= 0) return;
    let start = null;
    let raf;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}
