import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => { try { const value = localStorage.getItem('ardnet.theme'); return ['light', 'dark'].includes(value) ? value : 'system'; } catch { return 'system'; } });
  const [system, setSystem] = useState(systemTheme);
  const theme = preference === 'system' ? system : preference;
  useEffect(() => { const media = window.matchMedia('(prefers-color-scheme: dark)'); const update = () => setSystem(systemTheme()); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => { const sync = event => { if (event.key === 'ardnet.theme') setPreference(['dark', 'light'].includes(event.newValue) ? event.newValue : 'system'); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  function chooseTheme(value) { setPreference(value); try { if (value === 'system') localStorage.removeItem('ardnet.theme'); else localStorage.setItem('ardnet.theme', value); } catch {} }
  return <ThemeContext.Provider value={{ theme, preference, chooseTheme, toggleTheme: () => chooseTheme(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
