"use client";

import { useState, useCallback, useMemo, useRef } from "react";

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((filenames: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const fn of filenames) next.add(fn);
      return next;
    });
  }, []);

  const deselectAll = useCallback((filenames: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const fn of filenames) next.delete(fn);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  // Use a ref so the function identity is stable — prevents Grid re-renders
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const isSelected = useCallback(
    (filename: string) => selectedRef.current.has(filename),
    []
  );

  const count = selected.size;
  const filenames = useMemo(() => Array.from(selected), [selected]);

  return { selected, toggle, selectAll, deselectAll, clear, isSelected, count, filenames };
}
