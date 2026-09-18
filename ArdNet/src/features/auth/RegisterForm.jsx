import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/slices/authSlice';
import Button from '../../components/common/Button';
import { ROLES } from '../../utils/constants';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState(ROLES.FARMER);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Complete all fields. Password must be at least 8 characters.');
      return;
    }
    const user = { name: name.trim(), email: email.trim(), contact: contact.trim(), role };
    dispatch(loginSuccess(user));
    navigate(role === ROLES.BUYER ? '/buyer' : '/dashboard');
  };

  return (
    <form className="auth-card register-card card" onSubmit={submit}>
      <p className="eyebrow">CREATE ACCOUNT</p>
      <h1>Join ArdNet</h1>
      <p className="auth-intro">Create your account to connect with local produce buyers and sellers.</p>
      {error && <div className="form-message error">{error}</div>}
      <div className="register-fields">
        <label className="form-group">Full name<input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="form-group">Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="form-group">Contact number<input className="input" type="tel" value={contact} onChange={(e) => setContact(e.target.value)} required /></label>
        <label className="form-group">Password<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></label>
      </div>
      <label className="form-group register-role">Role
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value={ROLES.FARMER}>Farmer</option>
          <option value={ROLES.BUYER}>Buyer / Vendor</option>
        </select>
      </label>
      <Button className="register-submit" type="submit">Create Account</Button>
    </form>
  );
}
