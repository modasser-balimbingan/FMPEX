import { useEffect, useRef, useState } from 'react';
import ListingIcon from '../listings/ListingIcon';

export default function AuthGarden({ admin = false }) {
  const garden = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (garden.current) observer.observe(garden.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={garden} className={`auth-garden${visible ? ' is-visible' : ''}`} aria-hidden="true">
    <div className="auth-garden__sun" />
    <svg className="auth-garden__landscape" viewBox="0 0 400 200" fill="none"><path d="M0 125Q110 25 240 115T440 95V210H0Z" fill="#75a968" /><path d="M0 155Q140 65 295 145T440 130V210H0Z" fill="#4d8b58" /><path d="M0 190Q150 110 400 170V210H0Z" fill="#2f6b48" /><g stroke="#b8d99a" strokeWidth="1.5" opacity=".55"><path d="M30 190Q140 125 360 181M90 205Q210 149 400 195M0 165Q125 79 250 138" /></g></svg>
    <svg className="auth-garden__wind" viewBox="0 0 400 100" fill="none" stroke="#f4fae8" strokeWidth="2" strokeLinecap="round"><path d="M5 40h72q24 0 24-14t-18-10M125 61h90q30 0 30-16t-21-13M270 28h54q24 0 24-12t-17-7" /></svg>
    {[0, 1, 2].map(index => <span className={`auth-garden__drifting-leaf auth-garden__drifting-leaf--${index}`} key={index}><ListingIcon name="leaf" size={index === 1 ? 17 : 22} /></span>)}
    <div className="auth-garden__leaf"><ListingIcon name={admin ? 'user' : 'leaf'} size={34} /></div>
    <svg className="auth-garden__market" viewBox="0 0 400 215" fill="none">
      {/* Local produce stall, seller, and buyer. All motion uses CSS transforms. */}
      <path d="M122 76v109m121-109v109" stroke="#376848" strokeWidth="6" strokeLinecap="round" />
      <path d="m113 75 15-37h108l16 37Z" fill="#f1e4ad" />
      <path d="m140 38-7 37h25l3-37m25 0 3 37h25l-7-37m24 0 15 37h-21l-10-37" fill="#4e8f55" />
      <path d="M113 75v9q10 12 23 0 12 12 24 0 12 12 24 0 12 12 24 0 12 12 24 0 12 12 20 0v-9" fill="#e5d69d" />
      <g className="auth-market__seller">
        <circle cx="190" cy="103" r="14" fill="#b87950" />
        <path d="M175 100q2-24 27-11l4 13-9-5-22 3" fill="#3f4d30" />
        <path d="M172 143v-17q2-13 18-13t18 13v17" fill="#f6f2d2" />
        <path d="M181 118v25h24l-7-25" fill="#539354" />
        <path className="auth-market__seller-arm" d="m204 124 18 7 18-9" stroke="#b87950" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="auth-market__buyer">
        <path d="m299 157-4 39m19-39 9 39" stroke="#365444" strokeWidth="10" strokeLinecap="round" />
        <path d="M289 125q16-13 32 0l2 36h-37Z" fill="#e7bb69" />
        <circle cx="305" cy="108" r="14" fill="#daa576" />
        <path d="M290 109q-5-27 20-20 15 4 10 24l-8-16-22 12" fill="#3a5040" />
        <path className="auth-market__buyer-arm" d="m293 130-21 7-19-12" stroke="#daa576" strokeWidth="8" strokeLinecap="round" />
        <path d="m319 135 11 23" stroke="#daa576" strokeWidth="8" strokeLinecap="round" />
        <path d="M320 164q10-21 20 0" stroke="#876541" strokeWidth="3" /><path d="m316 162 29 0-4 24h-21Z" fill="#bc8f51" />
      </g>
      <g className="auth-market__exchange"><path d="m235 121 23 0-4 20h-16Z" fill="#9caf58" /><path d="M240 121q7-16 13 0" stroke="#537e42" strokeWidth="2" /><circle cx="246" cy="119" r="6" fill="#e0b45c" /></g>
      <path d="M115 145h139v13H115Z" fill="#d3a66a" /><path d="M122 158h125v30H122Z" fill="#b98b52" /><path d="M131 167h107m-107 12h107" stroke="#cea169" strokeWidth="3" />
      <g><ellipse cx="146" cy="139" rx="18" ry="6" fill="#76994d" /><circle cx="136" cy="133" r="7" fill="#d8ab54" /><circle cx="150" cy="131" r="8" fill="#efcb65" /><circle cx="159" cy="136" r="6" fill="#b5bc59" /><path d="M168 137q12-23 23 0" fill="#6b9b51" /><path d="M199 138q14-22 24 0" fill="#a3b55a" /></g>
      <g className="auth-market__chat auth-market__chat--seller"><path d="M206 18h29a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8h-15l-9 8v-8h-5a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z" fill="#f6fae9" /><path d="m210 32 5 5 10-11" stroke="#5b9452" strokeWidth="3" strokeLinecap="round" /></g>
      <g className="auth-market__chat auth-market__chat--buyer"><path d="M300 42h31a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8h-9l-8 8v-8h-14a8 8 0 0 1-8-8V50a8 8 0 0 1 8-8Z" fill="#eaf3d6" /><circle cx="304" cy="56" r="2" fill="#5b8450" /><circle cx="315" cy="56" r="2" fill="#5b8450" /><circle cx="326" cy="56" r="2" fill="#5b8450" /></g>
    </svg>
    <div className="auth-garden__card"><span><ListingIcon name="check" size={17} /></span><div><strong>{admin ? 'Built around your community' : 'From local farms to local markets'}</strong><small>{admin ? 'Manage with clarity and care' : 'Discover. Connect. Grow.'}</small></div></div>
  </div>;
}
