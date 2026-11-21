import { useEffect, useRef, useState } from 'react';

const DEFAULT_WIDTH = 246;
const MIN_WIDTH = 220;
const MAX_WIDTH = 380;
const maximumWidth = () => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - 520));
const clamp = (value, maximum = MAX_WIDTH) => Math.min(maximum, Math.max(MIN_WIDTH, Number(value) || DEFAULT_WIDTH));

function readPreference(key, role) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && ['expanded', 'compact', 'hidden'].includes(stored.mode)) return { mode: stored.mode, width: clamp(stored.width) };
    const legacyKey = role === 'admin' ? 'ardnet.admin.sidebar.collapsed' : 'ardnet.sidebar.collapsed';
    return { mode: JSON.parse(localStorage.getItem(legacyKey)) === true ? 'compact' : 'expanded', width: DEFAULT_WIDTH };
  } catch { return { mode: 'expanded', width: DEFAULT_WIDTH }; }
}

export default function useSidebarLayout({ role, userId, mobile, shell }) {
  const storageKey = `ardnet.sidebar.${role}.${userId || 'member'}.layout`;
  const [preference, setPreference] = useState(() => readPreference(storageKey, role));
  const [maximum, setMaximum] = useState(maximumWidth);
  const [resizing, setResizing] = useState(false);
  const gesture = useRef(null);
  const frame = useRef(null);
  const effectiveWidth = clamp(preference.width, maximum);

  function save(next) {
    setPreference(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep controls usable when storage is unavailable. */ }
  }
  function paint(width) {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      shell.current?.style.setProperty('--member-sidebar-expanded-width', `${width}px`);
      frame.current = null;
    });
  }
  function finish(commit = true) {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = null;
    const width = commit ? current.width : current.startWidth;
    shell.current?.style.setProperty('--member-sidebar-expanded-width', `${width}px`);
    setResizing(false);
    if (commit) save({ ...preference, width });
  }

  useEffect(() => { setPreference(readPreference(storageKey, role)); }, [storageKey, role]);
  useEffect(() => {
    const resize = () => { finish(false); setMaximum(maximumWidth()); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  });
  useEffect(() => {
    if (!resizing) return;
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); finish(false); } };
    const blur = () => finish(false);
    window.addEventListener('keydown', escape);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('blur', blur); };
  });
  useEffect(() => () => { if (frame.current !== null) window.cancelAnimationFrame(frame.current); }, []);

  const resizeHandle = {
    onPointerDown(event) {
      if (mobile || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.current = { id: event.pointerId, x: event.clientX, startWidth: effectiveWidth, width: effectiveWidth };
      setResizing(true);
    },
    onPointerMove(event) {
      const current = gesture.current;
      if (!current || current.id !== event.pointerId) return;
      current.width = clamp(current.startWidth + event.clientX - current.x, maximumWidth());
      paint(current.width);
    },
    onPointerUp(event) { if (gesture.current?.id === event.pointerId) finish(); },
    onPointerCancel() { finish(false); },
    onLostPointerCapture() { finish(false); },
    onDoubleClick() { save({ ...preference, width: DEFAULT_WIDTH }); },
    onKeyDown(event) {
      if (gesture.current || !['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 25 : 10;
      const width = event.key === 'Home' ? MIN_WIDTH : event.key === 'End' ? maximum : event.key === 'Enter' ? DEFAULT_WIDTH : effectiveWidth + (event.key === 'ArrowLeft' ? -step : step);
      save({ ...preference, width: clamp(width, maximum) });
    },
  };
  return { mode: preference.mode, width: effectiveWidth, minimum: MIN_WIDTH, maximum, resizing, resizeHandle,
    setMode: mode => { finish(false); save({ ...preference, mode }); } };
}
