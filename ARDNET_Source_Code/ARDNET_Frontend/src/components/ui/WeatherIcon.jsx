import { useEffect, useRef, useState } from 'react';
import '../../styles/weather.scss';

export function weatherKind(code, condition = '') {
  const text = condition.toLowerCase();
  if (code >= 95 || /thunder/.test(text)) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || /rain|drizzle/.test(text)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86 || /snow/.test(text)) return 'snow';
  if (code === 45 || code === 48 || /fog/.test(text)) return 'fog';
  if (code === 0 || /^(clear sky|sunny)$/.test(text)) return 'sun';
  if (code === 3 || /overcast/.test(text)) return 'cloud';
  return 'partly';
}

export default function WeatherIcon({ code, condition, small = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const kind = weatherKind(code, condition);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={ref} className={`weather-art weather-art--${kind}${small ? ' weather-art--small' : ''}${visible ? ' is-visible' : ''}`} aria-hidden="true">
      <span className="weather-art__sun" />
      <span className="weather-art__cloud"><span /></span>
      <span className="weather-art__drops"><i /><i /><i /></span>
      <span className="weather-art__bolt" />
      <span className="weather-art__mist" />
    </span>
  );
}
