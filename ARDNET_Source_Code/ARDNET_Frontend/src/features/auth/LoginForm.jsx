import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/slices/authSlice';
import { ROLES } from '../../utils/constants';
import { apiClient } from '../../api/apiClient';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import PasswordInput from './PasswordInput';

export default function LoginForm({ admin = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guest, setGuest] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const { notify } = useApp();

  const submit = async (event) => {
  event.preventDefault();
  if (isSubmitting) return;
  setError('');
  setVerificationRequired(false);

  if (guest) {
    dispatch(
      loginSuccess({
        user: {
          name: 'Guest visitor',
          email: '',
          role: 'guest',
        },
        token: null,
      })
    );

    notify('Guest access accepted. You can browse public listings.', 'success');
    navigate('/listings');
    return;
  }

  if (admin) {
    if (!email.trim() || !password) {
      setError('Enter your administrator email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!response.success) {
        throw new Error(response.error || 'Administrator sign-in failed.');
      }

      if (response.data?.user?.role !== ROLES.ADMIN) {
        setError('This account does not have administrator access.');
        notify('Administrator access denied.', 'error');
        return;
      }

      dispatch(loginSuccess(response.data));
      notify('Administrator sign-in successful.', 'success');
      navigate('/admin');
    } catch (loginError) {
      console.error('Administrator login error:', loginError);
      setError(loginError.message || 'Unable to sign in as administrator.');
      notify('Sign-in failed. Check your email and password.', 'error');
    } finally {
      setIsSubmitting(false);
    }

    return;
  }

  if (!email || password.length < 8) {
    setError(
      'Enter a valid email and a password with at least 8 characters.'
    );
    notify('Please correct the highlighted sign-in details.', 'error');
    return;
  }

  setIsSubmitting(true);
  try {
    const response = await fetch(
      'http://localhost:5000/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'EMAIL_NOT_VERIFIED') setVerificationRequired(true);
      throw new Error(data.error || 'Login failed.');
    }

    dispatch(loginSuccess(data));

    notify('Sign-in successful. Opening your workspace.', 'success');

    navigate(
      data.user.role === ROLES.BUYER
        ? '/buyer'
        : '/dashboard'
    );

  } catch (error) {
    console.error('Login error:', error);

    setError(error.message || 'Unable to sign in.');
    notify('Sign-in failed. Check your email and password.', 'error');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <form className="auth-card card" onSubmit={submit}>
      <p className="eyebrow">{admin ? 'RESTRICTED ACCESS' : 'ARDNET ACCOUNT'}</p>
      <h1>{admin ? 'Administrator login' : 'Welcome back'}</h1>
      <p className="auth-intro">{admin ? 'Sign in to manage your community and market records.' : 'Sign in to pick up where you left off.'}</p>
      {error && <div className="form-message error" role="alert">{error}{verificationRequired && <> <Link to={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}>Verify or resend the email</Link>.</>}</div>}
      {!guest && <><label className="form-group" htmlFor="login-email">Email address<input id="login-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? 'Enter your administrator email' : 'Enter your email address'} required /></label>
      <div className="form-group"><label htmlFor="login-password">Password</label><PasswordInput id="login-password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <p className="forgot-password-link"><Link to="/forgot-password">Forgot password?</Link></p></>}
      {guest && <p className="auth-guest-note">Explore produce listings and reference prices. You can sign in whenever you’re ready.</p>}
      <Button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : guest ? 'Explore ArdNet' : admin ? 'Open admin workspace' : 'Sign in'}</Button>
      {!admin && <><div className="auth-divider"><span>or take a look around</span></div><button className="auth-guest-button" type="button" disabled={isSubmitting} onClick={() => setGuest((value) => !value)}>{guest ? 'Use account login' : 'Continue as guest'}</button></>}
      {admin && <p className="security-note">Use your assigned administrator account to continue.</p>}
    </form>
  );
}
