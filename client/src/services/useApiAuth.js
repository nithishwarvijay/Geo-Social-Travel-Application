import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

import api from './api';

export function useApiAuth() {
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  if (disableClerk) {
    return api;
  }

  const { getToken } = useAuth();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [getToken]);

  return api;
}
