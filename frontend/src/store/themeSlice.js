import { createSlice } from "@reduxjs/toolkit";
import { applyTheme, getTheme } from "../utils/theme";

// Light or dark mode for the whole site.
const themeSlice = createSlice({
  name: "theme",
  initialState: getTheme(),
  reducers: {
    themeChanged: (state, action) => action.payload,
  },
});

const { themeChanged } = themeSlice.actions;

// Painting the page and saving the choice are side effects, so they happen here, not in the reducer.
const toggleTheme = () => (dispatch, getState) => {
  const nextTheme = getState().theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  dispatch(themeChanged(nextTheme));
};

const selectTheme = (state) => state.theme;

export { toggleTheme, selectTheme };
export default themeSlice.reducer;
