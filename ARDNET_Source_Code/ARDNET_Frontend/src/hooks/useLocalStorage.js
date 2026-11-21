import { useCallback, useState } from 'react';

// Reusable React hook: keeps component state and localStorage in sync.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const updateValue = useCallback((nextValue) => {
    setValue((currentValue) => {
      const resolved = nextValue instanceof Function
        ? nextValue(currentValue)
        : nextValue;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  }, [key]);

  return [value, updateValue];
}
