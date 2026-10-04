const TOKEN_KEY = "token";
const USER_KEY = "user";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getUser = () => JSON.parse(localStorage.getItem(USER_KEY) ?? "null");

const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export { getToken, getUser, saveSession, clearSession };
