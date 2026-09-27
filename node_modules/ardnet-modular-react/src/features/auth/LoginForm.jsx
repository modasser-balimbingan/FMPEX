import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/slices/authSlice';
import { DEMO_ADMIN, ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';

export default function LoginForm({ admin = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guest, setGuest] = useState(false);
  const [error, setError] = useState('');
  const { notify } = useApp();

  const submit = (event) => {
    event.preventDefault();
    setError('');

    if (guest) {
      dispatch(loginSuccess({ name: 'Guest visitor', email: '', role: 'guest' }));
      notify('Guest access accepted. You can browse public listings.', 'success');
      navigate('/listings');
      return;
    }
    if (admin) {
      if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
        dispatch(loginSuccess(DEMO_ADMIN));
        notify('Administrator sign-in accepted.', 'success');
        navigate('/admin');
      } else {
        setError('Invalid administrator credentials.');
        notify('Sign-in failed. Check your email and password.', 'error');
      }
      return;
    }

    if (!email || password.length < 8) {
      setError('Enter a valid email and a password with at least 8 characters.');
      notify('Please correct the highlighted sign-in details.', 'error');
      return;
    }

    const buyer = email.toLowerCase().includes('buyer');
    const user = {
      name: email.split('@')[0],
      email,
      role: buyer ? ROLES.BUYER : ROLES.FARMER,
    };

    dispatch(loginSuccess(user));
    notify('Sign-in accepted. Opening your workspace.', 'success');
    navigate(buyer ? '/buyer' : '/dashboard');
  };

  return (
    <form className="auth-card card" onSubmit={submit}>
      <p className="eyebrow">{admin ? 'RESTRICTED ACCESS' : 'ARDNET ACCOUNT'}</p>
      <h1>{admin ? 'Administrator login' : 'Welcome back'}</h1>
      {error && <div className="form-message error">{error}</div>}
      {!guest && <><label className="form-group">Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? 'admin@ardnet.ph' : 'farmer@example.com'} required /></label>
      <label className="form-group">Password<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label></>}
      <Button className="login-submit" type="submit">{admin ? 'Open Admin Dashboard' : 'Sign in'}</Button>
      {!admin && <button className="text-button" type="button" onClick={() => setGuest((value) => !value)}>{guest ? 'Use account login' : 'Continue as guest'}</button>}
      {admin && <p className="security-note">Prototype demo: <strong>{DEMO_ADMIN.email}</strong> / <strong>{DEMO_ADMIN.password}</strong></p>}
    </form>
  );
}
