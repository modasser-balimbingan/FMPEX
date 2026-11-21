
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ROLES } from '../../utils/constants';
import PasswordInput from './PasswordInput';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLES.FARMER);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please complete all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setShakePassword(true);
      setError('Passwords do not match. Please check both password fields.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="auth-card register-card card"
      onSubmit={submit}
    >
      <p className="eyebrow">CREATE ACCOUNT</p>

      <h1>Join ArdNet</h1>

      <p className="auth-intro">
        A fresh connection starts here. Create your farmer or buyer account.
      </p>

      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      <div className="register-fields">
        {/* 1. Full Name */}
        <label className="form-group">
          Full Name
          <input
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </label>

        {/* 2. Email Address */}
        <label className="form-group">
          Email Address
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />
        </label>

        {/* 3. Password */}
        <div className="form-group">
          <label htmlFor="register-password">Password</label>

            <PasswordInput
              id="register-password"
              invalid={passwordsMismatch}
              aria-describedby={passwordsMismatch ? 'password-match-feedback' : undefined}
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
            />

          <small className="auth-field-hint">Use at least 8 characters.</small>
        </div>

        {/* 4. Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>

            <PasswordInput
              id="confirm-password"
              invalid={passwordsMismatch}
              shake={shakePassword && passwordsMismatch}
              onShakeEnd={() => setShakePassword(false)}
              onBlur={() => { if (passwordsMismatch) setShakePassword(true); }}
              aria-describedby={confirmPassword.length > 0 ? 'password-match-feedback' : undefined}
              className="input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />


          {confirmPassword.length > 0 && <p id="password-match-feedback" className={passwordsMismatch ? 'password-mismatch' : 'password-match'} role="status">
            {passwordsMismatch ? 'Passwords do not match. Please check both fields.' : 'Passwords match.'}
          </p>}
        </div>

        {/* 5. Role */}
        <label className="form-group">
          I’m joining as a
          <select
            className="select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value={ROLES.FARMER}>Farmer</option>
            <option value={ROLES.BUYER}>Buyer / Vendor</option>
          </select>
        </label>
      </div>

      <p className="auth-verification-note">We’ll email you a verification link to activate sign-in.</p>

      {/* 6. Create Account */}
      <Button
        className="register-submit"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
