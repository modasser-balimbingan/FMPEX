import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeControl() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [slot, setSlot] = useState(null);
  useLayoutEffect(() => { setSlot(document.querySelector('[data-theme-slot]')); }, [pathname]);
  const button = <button type="button" className={`theme-toggle${slot ? '' : ' theme-toggle--floating'}`} onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A8.8 8.8 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}</svg>
  </button>;
  return slot ? createPortal(button, slot) : button;
}
