import { createSlice } from "@reduxjs/toolkit";
import * as authApi from "../api/auth";
import { getUser, saveSession, clearSession } from "../utils/session";

// Who is logged in. It starts from localStorage, so a page refresh keeps the user logged in.
const authSlice = createSlice({
  name: "auth",
  initialState: { user: getUser() },
  reducers: {
    loggedIn: (state, action) => {
      state.user = action.payload;
    },
    loggedOut: (state) => {
      state.user = null;
    },
  },
});

const { loggedIn, loggedOut } = authSlice.actions;

const login = (email, password) => async (dispatch) => {
  const data = await authApi.login(email, password);
  saveSession(data.token, data.user);
  dispatch(loggedIn(data.user));
  return data.user;
};

const logout = () => async (dispatch) => {
  try {
    await authApi.logout();
  } catch {}
  clearSession();
  dispatch(loggedOut());
};

// Components read the user with useSelector(selectUser).
const selectUser = (state) => state.auth.user;

export { login, logout, selectUser };
export default authSlice.reducer;
