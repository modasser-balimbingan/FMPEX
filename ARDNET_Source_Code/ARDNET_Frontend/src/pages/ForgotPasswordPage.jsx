import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';
import DashboardIcon from '../components/ui/DashboardIcon';
import Button from '../components/common/Button';
import { apiClient } from '../api/apiClient';
import { useApp } from '../context/AppContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useApp();

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      if (!response.success) {
        throw new Error(response.error || 'Unable to submit your request. Please try again.');
      }
      const genericMessage = response.data?.message ||
        'If an account exists for that email address, a password reset link will be sent shortly.';
      setMessage(genericMessage);
      notify('If the account exists, a reset email will be sent.', 'success');
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout recovery="forgot">
      <section className="auth-card card">
        <span className="recovery-symbol"><DashboardIcon name={message ? 'mail' : 'lock'} size={27} /></span>
        {message ? <>
          <p className="eyebrow">YOUR NEXT STEP</p><h1>Check your inbox.</h1>
          <p className="auth-intro" role="status">{message}</p>
          <div className="recovery-address"><small>Email entered</small><strong>{email.trim().toLowerCase()}</strong></div>
          <ol className="recovery-steps"><li><span>1</span>Look for an ArdNet password reset email, including in your spam folder.</li><li><span>2</span>Open the reset link within 20 minutes and choose a fresh password.</li></ol>
          <div className="recovery-actions"><Link className="btn btn-primary recovery-primary" to="/login">Return to sign in <DashboardIcon name="arrowRight" size={17} /></Link><button className="auth-guest-button" type="button" onClick={() => { setMessage(''); setError(''); }}>Try another email address</button></div>
        </> : <>
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot your password?</h1>
          <p className="auth-intro">It happens. Enter the email you use for ArdNet, and we’ll help you take the next step.</p>
          <form className="recovery-form" onSubmit={submit}>
          {error && <div className="form-message error" role="alert">{error}</div>}
          <label className="form-group">
            Email address
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} disabled={loading} required placeholder="you@example.com" />
          </label>
          <Button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Requesting your link…' : 'Send reset link'}<DashboardIcon name="arrowRight" size={17} />
          </Button>
          </form>
          <p className="recovery-note"><DashboardIcon name="shield" size={18} /> Reset links last 20 minutes and work once. Your password stays the same until you choose a new one.</p>
        </>}
      </section>
    </AuthLayout>
  );
}
