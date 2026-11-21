import AuthLayout from '../layout/AuthLayout';
import LoginForm from '../features/auth/LoginForm';

export default function LoginPage({ admin = false }) {
  return <AuthLayout admin={admin}><LoginForm admin={admin} /></AuthLayout>;
}
