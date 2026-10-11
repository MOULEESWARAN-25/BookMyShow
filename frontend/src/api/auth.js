import { request } from "./client";

const signup = (name, email, password) =>
  request("/auth/signup", { method: "POST", body: { name, email, password } });

const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });

const logout = () => request("/auth/logout", { method: "POST" });

export { signup, login, logout };
