import { useSelector } from 'react-redux';

export function useAuth() {
  const user = useSelector((state) => state.auth.user);
  return { user, isAuthenticated: Boolean(user), role: user?.role ?? null };
}
