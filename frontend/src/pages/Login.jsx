import { useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/roles";
import Message from "../components/Message";

const Login = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // After this, user is set and the redirect below takes them where they were going.
      await login(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // One redirect for both cases: just logged in, or opened the login page while logged in.
  // "from" is where they came from, and returnState what they were doing, such as chosen seats.
  if (user) {
    return (
      <Navigate
        to={location.state?.from ?? homeFor(user.role)}
        state={location.state?.returnState}
        replace
      />
    );
  }

  return (
    <div className="form-page">
      <div className="form-icon">
        <LogIn />
      </div>
      <h1>Welcome back</h1>
      <p className="muted">Log in to book tickets or manage your theatres.</p>
      {searchParams.get("expired") && (
        <Message type="error">Your session expired. Please log in again.</Message>
      )}
      {location.state?.message && <Message type="success">{location.state.message}</Message>}
      {error && <Message type="error">{error}</Message>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <span className="input-with-icon">
            <Mail />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </span>
        </label>
        <label>
          Password
          <span className="input-with-icon">
            <LockKeyhole />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </span>
        </label>
        <button type="submit" disabled={submitting}>
          <LogIn /> {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        New here?{" "}
        <Link to="/signup" state={location.state}>
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;
