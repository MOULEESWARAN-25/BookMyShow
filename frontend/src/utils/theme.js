const THEME_KEY = "theme";

const getTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme, persist = true) => {
  document.documentElement.classList.toggle("dark", theme === "dark");

  if (persist) {
    localStorage.setItem(THEME_KEY, theme);
  }
};

export { getTheme, applyTheme };
