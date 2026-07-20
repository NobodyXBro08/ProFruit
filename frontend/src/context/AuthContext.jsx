import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../config/api';
import { formatApiError } from '../utils/apiError';
import { hasPermission, isStaffRole, normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

const STORAGE_KEY = 'profruit-auth-v2';

function normalizeUserId(value) {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function profileFromApiUser(u) {
  if (!u || typeof u !== 'object') return {};
  return {
    ...(typeof u.fullName === 'string' && u.fullName.trim() && { fullName: u.fullName.trim() }),
    ...(typeof u.phone === 'string' && u.phone.trim() && { phone: u.phone.trim() }),
    ...(typeof u.city === 'string' && u.city.trim() && { city: u.city.trim() }),
    ...(typeof u.address === 'string' && u.address.trim() && { address: u.address.trim() }),
    ...(typeof u.shippingAddress === 'string' &&
      u.shippingAddress.trim() &&
      !u.address && { address: u.shippingAddress.trim(), shippingAddress: u.shippingAddress.trim() }),
  };
}

function readStoredToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const o = JSON.parse(raw);
    return typeof o?.token === 'string' ? o.token.trim() : '';
  } catch {
    return '';
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    const id = normalizeUserId(o?.id);
    const token = typeof o?.token === 'string' ? o.token.trim() : '';
    if (!o || id === null || !token || typeof o.username !== 'string' || !o.username.trim()) return null;
    return {
      id,
      username: o.username.trim(),
      role: normalizeRole(o.role),
      token,
      ...profileFromApiUser(o),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('profruit-auth-v1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!user?.token) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      try {
        const res = await fetch(api('/api/me'), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = formatApiError(data, res.status);
          console.warn('[Auth] Sesión inválida:', { status: res.status, body: data });
          throw new Error(message);
        }
        const data = await res.json();
        const uid = normalizeUserId(data.user?.id);
        if (!data.user || uid === null) throw new Error('Respuesta de /api/me inválida.');
        if (!cancelled) {
          setSessionError(null);
          setUser((prev) => {
            if (!prev?.token) return null;
            return {
              ...prev,
              id: uid,
              username: String(data.user.username).trim(),
              role: normalizeRole(data.user.role),
              token: prev.token,
              ...profileFromApiUser(data.user),
            };
          });
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          if (err instanceof Error && err.message) {
            setSessionError(err.message);
          }
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- solo al montar

  const login = useCallback(async (username, password) => {
    let res;
    try {
      res = await fetch(api('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (networkErr) {
      console.error('[Auth] Login — error de red:', networkErr);
      throw new Error('No se pudo conectar con el servidor. Revisa tu conexión o REACT_APP_API_URL.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = formatApiError(data, res.status);
      console.error('[Auth] Login fallido:', { status: res.status, body: data });
      const err = new Error(message);
      err.status = res.status;
      err.api = data;
      throw err;
    }

    const uid = normalizeUserId(data.user?.id);
    const token = typeof data.token === 'string' ? data.token.trim() : '';
    if (!data.user || uid === null || !token || typeof data.user.username !== 'string' || !String(data.user.username).trim()) {
      console.error('[Auth] Login — respuesta incompleta:', data);
      throw new Error(
        'Respuesta del servidor incompleta (falta token o usuario). ¿JWT_SECRET configurado en el backend?',
      );
    }

    const u = data.user;
    const session = {
      id: uid,
      username: String(u.username).trim(),
      role: normalizeRole(u.role),
      token,
      ...profileFromApiUser(u),
    };
    setSessionError(null);
    setUser(session);
    setSessionReady(true);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    let res;
    try {
      res = await fetch(api('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      console.error('[Auth] Register — error de red:', networkErr);
      throw new Error('No se pudo conectar con el servidor.');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(formatApiError(data, res.status));
    }
    return res.json().catch(() => ({}));
  }, []);

  const updateProfile = useCallback(
    async (payload) => {
      const token = (user?.token || readStoredToken()).trim();
      if (!token) throw new Error('Debes iniciar sesión.');
      const res = await fetch(api('/api/me'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, res.status));
      if (data.user) {
        setUser((prev) => {
          if (!prev?.token) return prev;
          return {
            ...prev,
            ...profileFromApiUser(data.user),
            username: String(data.user.username || prev.username).trim(),
            role: normalizeRole(data.user.role || prev.role),
          };
        });
      }
      return data;
    },
    [user?.token],
  );

  const logout = useCallback(() => {
    setUser(null);
    setSessionError(null);
  }, []);

  const tokenRef = useRef(user?.token ?? '');
  useEffect(() => {
    tokenRef.current = (user?.token || readStoredToken()).trim();
  }, [user?.token]);

  const getAuthToken = useCallback(
    () => (tokenRef.current || readStoredToken()).trim(),
    [],
  );

  const authFetch = useCallback(async (path, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Debes iniciar sesión.');
    }
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(api(path), { ...options, headers });
  }, [getAuthToken]);

  const isAdmin = isStaffRole(user?.role);
  const can = useCallback((permission) => hasPermission(user?.role, permission), [user?.role]);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      updateProfile,
      logout,
      authFetch,
      getAuthToken,
      isAdmin,
      can,
      sessionReady,
      sessionError,
    }),
    [user, login, register, updateProfile, logout, authFetch, getAuthToken, isAdmin, can, sessionReady, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
