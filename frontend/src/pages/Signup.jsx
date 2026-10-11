import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import { signup } from "../api/auth";
import Message from "../components/Message";

const Signup = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(name, email, password);
      // Keep where the user was heading (for example their chosen seats) for after they log in.
      navigate("/login", { state: { ...location.state, message: "Account created. Please log in." } });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="form-page">
      <div className="form-icon">
        <UserPlus />
      </div>
      <h1>Create your account</h1>
      <p className="muted">Sign up to book seats and get your tickets by email.</p>
      {error && <Message type="error">{error}</Message>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <span className="input-with-icon">
            <User />
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </span>
        </label>
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
          <small className="muted">At least 8 characters, with a letter and a number</small>
        </label>
        <button type="submit" disabled={submitting}>
          <UserPlus /> {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <Link to="/login" state={location.state}>
          Login
        </Link>
      </p>
    </div>
  );
};

export default Signup;
