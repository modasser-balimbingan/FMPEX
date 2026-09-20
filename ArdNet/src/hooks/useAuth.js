import { useSelector } from 'react-redux';

export function useAuth() {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user && user.role !== 'guest');
  return { user, isAuthenticated, role: user?.role ?? null };
}
