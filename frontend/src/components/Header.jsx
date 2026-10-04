import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CircleUserRound,
  Clapperboard,
  Film,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  Ticket,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getTheme } from "../utils/theme";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getTheme());
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // On phones the links sit behind a menu button; close it after moving to another page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className={menuOpen ? "header menu-open" : "header"}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="BookMyShow home">
          <Ticket className="brand-icon" />
          <span className="brand-text">
            Book<span>My</span>Show
          </span>
        </Link>

        <button
          className="icon-button menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className="nav">
          <NavLink to="/" end>
            <Film /> Movies
          </NavLink>
          {user?.role === "user" && (
            <NavLink to="/bookings">
              <Ticket /> My bookings
            </NavLink>
          )}
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" end>
                <LayoutDashboard /> Dashboard
              </NavLink>
              <NavLink to="/admin/theatres">
                <Building2 /> My theatres
              </NavLink>
              <NavLink to="/admin/movies">
                <Clapperboard /> Manage movies
              </NavLink>
            </>
          )}
        </nav>

        <div className="nav">
          <button
            className="icon-button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
          {user ? (
            <>
              <span className="user-name">
                <CircleUserRound /> {user.name}
                {user.role === "admin" && <span className="role">Admin</span>}
              </span>
              <button className="secondary" onClick={handleLogout}>
                <LogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">
                <LogIn /> Login
              </NavLink>
              <NavLink to="/signup" className="nav-cta">
                <UserPlus /> Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
