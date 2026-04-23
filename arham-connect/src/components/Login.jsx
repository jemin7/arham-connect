import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted && session) {
        navigate("/chats");
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/chats"); // Redirect on success
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          username: username.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        [
          {
            id: data.user.id,
            full_name: fullName.trim(),
            name: fullName.trim(),
            username: username.trim(),
            email,
          },
        ],
        { onConflict: "id" },
      );

      if (
        profileError &&
        !profileError.message.toLowerCase().includes("profiles")
      ) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    if (data.session) {
      navigate("/chats");
    } else {
      setMessage(
        "Account created. If email confirmation is enabled in Supabase, verify your email and then log in.",
      );
      setMode("login");
      setPassword("");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-copy">
          <p className="eyebrow">Arham Connect</p>
          <h1>Realtime chat that feels like a product</h1>
          <p className="hero-text">
            Login or create an account to browse conversations, open a thread,
            and send live messages through Supabase Realtime.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "tab active" : "tab"}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-header">
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p>
              {mode === "login"
                ? "Use your Supabase email and password to open the chat app."
                : "Create credentials and an optional profile so other users see your name instead of a raw ID."}
            </p>
          </div>

          {error && <p className="status-banner error">{error}</p>}
          {message && <p className="status-banner success">{message}</p>}

          <form
            className="auth-form"
            onSubmit={mode === "login" ? handleLogin : handleSignup}
          >
            {mode === "signup" && (
              <>
                <label className="field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    placeholder="Arham User"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Username</span>
                  <input
                    type="text"
                    placeholder="arham_user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>
              </>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
