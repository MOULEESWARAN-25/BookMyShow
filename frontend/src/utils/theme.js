const THEME_KEY = "theme";

const getTheme = () => (localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");

// The dark colours in main.css apply when <html> has the "dark" class.
const applyTheme = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
};

export { getTheme, applyTheme };
