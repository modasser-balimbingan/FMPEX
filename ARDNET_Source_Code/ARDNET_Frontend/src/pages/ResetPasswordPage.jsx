import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';
import DashboardIcon from '../components/ui/DashboardIcon';
import PasswordInput from '../features/auth/PasswordInput';
import Button from '../components/common/Button';
import { apiClient } from '../api/apiClient';
import { useApp } from '../context/AppContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useApp();
  const [token] = useState(() => searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [shake, setShake] = useState(false);
  const mismatch = Boolean(confirmPassword && newPassword !== confirmPassword && confirmationTouched);

  useEffect(() => {
    // Reset tokens are secrets: avoid sending them in Referer headers and remove
    // them from the visible URL after capturing them in component state.
    let meta = document.querySelector('meta[name="referrer"]');
    const createdMeta = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'referrer';
      document.head.appendChild(meta);
    }
    const previousContent = meta.content;
    meta.content = 'no-referrer';
    window.history.replaceState({}, document.title, window.location.pathname);

    return () => {
      if (createdMeta) meta.remove();
      else meta.content = previousContent;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');

    if (!token) {
      setError('This password reset link is missing its token. Please request a new link.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmationTouched(true); setShake(true);
      setError('Your passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
      if (!response.success) {
        throw new Error(response.error || 'Unable to reset your password.');
      }
      notify('Password reset successfully. Please sign in with your new password.', 'success');
      navigate('/login', { replace: true });
    } catch (resetError) {
      setError(resetError.message || 'Unable to reset your password. Please request a new link if needed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout recovery="reset">
      <section className="auth-card card">
        <span className="recovery-symbol"><DashboardIcon name="lock" size={27} /></span>
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>{token ? 'A fresh password. A fresh start.' : 'Let’s get a new link.'}</h1>
          {token ? <>
          <p className="auth-intro">Choose a new password for your ArdNet account. Make it something only you know.</p>
          <form className="recovery-form" onSubmit={submit}>
          {error && <div className="form-message error" role="alert">{error}</div>}
          <div className="form-group"><label htmlFor="reset-new-password">New password</label><PasswordInput id="reset-new-password" value={newPassword} onChange={event => { setNewPassword(event.target.value); setError(''); }} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" disabled={loading} required /></div>
          <div className="form-group"><label htmlFor="reset-confirm-password">Confirm new password</label><PasswordInput id="reset-confirm-password" value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setError(''); }} onBlur={() => { setConfirmationTouched(true); if (confirmPassword && newPassword !== confirmPassword) setShake(true); }} invalid={mismatch} shake={shake} onShakeEnd={() => setShake(false)} aria-describedby={mismatch ? 'reset-password-mismatch' : undefined} autoComplete="new-password" minLength={8} placeholder="Re-enter your new password" disabled={loading} required /></div>
          {mismatch && <p className="password-mismatch recovery-checklist" id="reset-password-mismatch" role="status">Your passwords don’t match yet.</p>}
          <p className={'recovery-checklist' + (newPassword.length >= 8 ? ' is-valid' : '')}><DashboardIcon name={newPassword.length >= 8 ? 'check' : 'shield'} size={16} />Use at least 8 characters.</p>
          <Button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Updating password…' : 'Reset password'}<DashboardIcon name="arrowRight" size={17} />
          </Button>
          </form>
          <p className="recovery-note"><DashboardIcon name="shield" size={18} /> This link expires after 20 minutes and can only be used once.</p>
          <Link className="recovery-error-link" to="/forgot-password">Need a fresh reset link?<DashboardIcon name="arrowRight" size={15} /></Link>
          </> : <><p className="auth-intro">This page needs the secure link from your password reset email. Request a fresh link to continue.</p><Link className="btn btn-primary recovery-primary" to="/forgot-password">Request a reset link<DashboardIcon name="arrowRight" size={17} /></Link></>}
      </section>
    </AuthLayout>
  );
}
