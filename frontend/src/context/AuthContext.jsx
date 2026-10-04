import { createContext, useContext, useState } from "react";
import * as authApi from "../api/auth";
import { getUser, saveSession, clearSession } from "../utils/session";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    saveSession(data.token, data.user);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, the user should still be logged out here.
    }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
