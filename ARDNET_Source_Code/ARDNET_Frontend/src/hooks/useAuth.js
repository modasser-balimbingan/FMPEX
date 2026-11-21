import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../api';
import { loginSuccess, logoutSuccess } from '../redux/slices/authSlice';

/**
 * Authentication hook shared by account and dashboard components.
 *
 * A profile endpoint returns the user object directly, while login and
 * registration return { user, token }. Normalize those shapes before
 * dispatching to Redux and do not log users out for temporary network/5xx
 * failures.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(user && authService.isAuthenticated())
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getProfile();

        if (cancelled) return;

        if (response.success && response.data) {
          // Profile response is a flat user object; keep the current token.
          dispatch(
            loginSuccess({
              user: response.data,
              token: authService.getToken(),
            })
          );
          setIsAuthenticated(true);
          setError(null);
          return;
        }

        // Only definitive authentication/account failures should clear a
        // session. Network errors and server errors must not cause logout.
        if ([401, 403, 404].includes(response.status) && response.data?.code !== 'ACCOUNT_SUSPENDED') {
          authService.logout();
          dispatch(logoutSuccess());
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(Boolean(user && authService.isAuthenticated()));
          setError(response.error || 'Unable to verify your profile right now.');
        }
      } catch (err) {
        if (cancelled) return;

        console.error('Auth initialization error:', err);
        // Preserve the session during transient client/network exceptions.
        setIsAuthenticated(Boolean(user && authService.isAuthenticated()));
        setError('Unable to verify your profile right now. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initializeAuth();

    const handleAuthExpiry = () => {
      dispatch(logoutSuccess());
      setIsAuthenticated(false);
      setError('Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth:expired', handleAuthExpiry);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:expired', handleAuthExpiry);
    };
    // Authentication is initialized on mount. Redux dispatch is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data?.user) {
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token || authService.getToken(),
          })
        );
        setIsAuthenticated(true);
      } else {
        setError(response.error || 'Login failed');
      }

      return response;
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);

      if (response.success && response.data?.user) {
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token || authService.getToken(),
          })
        );
        setIsAuthenticated(true);
      } else {
        setError(response.error || 'Registration failed');
      }

      return response;
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    authService.logout();
    dispatch(logoutSuccess());
    setIsAuthenticated(false);
    setError(null);
  }, [dispatch]);

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(profileData);

      if (response.success) {
        const updatedUser = response.data?.user || response.data;
        if (updatedUser && typeof updatedUser === 'object') {
          dispatch(
            loginSuccess({
              user: updatedUser,
              token: authService.getToken(),
            })
          );
        }
        return response;
      }

      setError(response.error || 'Profile update failed');
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Update failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };
}

export default useAuth;
