// global authentication context, provides login/logout and auth state
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    id: localStorage.getItem('id'),
  });

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('id', data.id);
    setAuth({ token: data.token, role: data.role, id: data.id }); // explicit, not spreading data as-is
 };

  const logout = () => {
    localStorage.clear();
    setAuth({ token: null, role: null, id: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);