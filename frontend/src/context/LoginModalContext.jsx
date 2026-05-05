import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import LoginModal from '../components/LoginModal/LoginModal.jsx';

const LoginModalContext = createContext(null);

export function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLogin = useCallback(() => setIsOpen(true), []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isOpen} onClose={closeLogin} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal debe usarse dentro de LoginModalProvider');
  return ctx;
}
