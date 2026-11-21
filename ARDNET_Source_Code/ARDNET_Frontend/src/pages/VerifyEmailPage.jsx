import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSuccess } from '../redux/slices/authSlice';
import { ROLES } from '../utils/constants';
import { useApp } from '../context/AppContext';
import AuthLayout from '../layout/AuthLayout';
import DashboardIcon from '../components/ui/DashboardIcon';
import Button from '../components/common/Button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useApp();
  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Email verification failed.');
        if (!data.token || !data.user) {
          throw new Error('Email was verified, but automatic sign-in could not be completed. Please sign in manually.');
        }
        if (!cancelled) {
          dispatch(loginSuccess(data));
          notify('Email verified successfully. You are now signed in.', 'success');
          navigate(data.user.role === ROLES.BUYER ? '/buyer' : data.user.role === ROLES.ADMIN ? '/admin' : '/dashboard', { replace: true });
        }
      } catch (verificationError) {
        if (!cancelled) setError(verificationError.message || 'Unable to verify email.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, dispatch, navigate, notify]);

  const resend = async (event) => {
    event.preventDefault();
    if (isResending || isLoading) return;
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Enter the email address you registered with.');
      return;
    }
    setIsResending(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to request a verification email.');
      setMessage(data.message || 'If an unverified account exists for that email, a verification link will be sent shortly.');
    } catch (resendError) {
      setError(resendError.message || 'Unable to request a verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return <AuthLayout recovery="verify">
    <section className="auth-card card">
      <span className={'recovery-symbol' + (isLoading ? ' recovery-symbol--loading' : '')}><DashboardIcon name={isLoading ? 'shield' : error ? 'history' : 'mail'} size={27} /></span>
      <p className="eyebrow">ONE LAST STEP</p>
      <h1>{isLoading ? 'Checking your email…' : message ? 'Check your inbox.' : token && error ? 'Let’s refresh your link.' : 'Your community awaits.'}</h1>
      {isLoading ? <>
        <p className="auth-intro">We’re checking your verification link. You’ll be signed in automatically once your email is confirmed.</p>
        <div className="recovery-loading" role="status"><span />Verifying your email address…</div>
      </> : <>
        {message ? <>
          <p className="auth-intro recovery-verification-result" role="status">{message}</p>
          <div className="recovery-address"><small>Email entered</small><strong>{email.trim().toLowerCase()}</strong></div>
          <p className="recovery-text">Check your inbox and spam folder for the latest ArdNet email. Open its verification link within 24 hours.</p>
          <div className="recovery-actions"><Link className="btn btn-primary recovery-primary" to="/login">Continue to sign in<DashboardIcon name="arrowRight" size={17} /></Link><button type="button" className="auth-guest-button" onClick={() => { setMessage(''); setError(''); }}>Try another email address</button></div>
        </> : <>
          <p className="auth-intro">{token && error ? 'Use your account email to request a fresh verification link, or return to sign in if your email is already verified.' : 'Open the verification email from ArdNet and confirm your email address. A fresh connection is one click away.'}</p>
          {error && <div className="form-message error" role="alert">{error}</div>}
          {!token && <ol className="recovery-steps"><li><span>1</span>Find the ArdNet verification email in your inbox or spam folder.</li><li><span>2</span>Select “Verify email address” within 24 hours to continue.</li></ol>}
          <form className="recovery-form" onSubmit={resend}>
            <label className="form-group">Email address<input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Your registered email address" autoComplete="email" maxLength={254} disabled={isResending} required /></label>
            <Button type="submit" disabled={isResending}>{isResending ? 'Requesting your link…' : 'Resend verification email'}<DashboardIcon name="arrowRight" size={17} /></Button>
          </form>
          <p className="recovery-note"><DashboardIcon name="shield" size={18} /> Confirming your email helps keep your account connected to you.</p>
        </>}
      </>}
    </section>
  </AuthLayout>;
}
