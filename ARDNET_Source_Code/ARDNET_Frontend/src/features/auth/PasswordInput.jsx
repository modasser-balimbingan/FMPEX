import { useId, useState } from 'react';

export default function PasswordInput({ id, invalid = false, shake = false, onShakeEnd, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return <div className={`auth-password${invalid ? ' is-invalid' : ''}${shake ? ' is-shaking' : ''}`} onAnimationEnd={event => { if (event.target === event.currentTarget) onShakeEnd?.(); }}>
    <input {...props} id={inputId} className="input" type={visible ? 'text' : 'password'} aria-invalid={invalid || undefined} />
    <button className="auth-password__toggle" type="button" onClick={() => setVisible(value => !value)}
      aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} aria-controls={inputId}
      title={visible ? 'Hide password' : 'Show password'}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </div>;
}
