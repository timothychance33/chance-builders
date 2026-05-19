import { useState } from "react";
import { signIn } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d1117;color:#e6e2d8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
    :root{--gold:#c8a456;--dark:#0d1117;--card:#161b24;--card2:#1c2230;--border:#252d3d;--text:#e6e2d8;--muted:#6b7592;--red:#e05252}
  `;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        {/* Logo */}
        <img
          src="/cb-logo.PNG"
          alt="Chance Builders"
          style={{ width: 140, height: 140, objectFit: "contain", marginBottom: 8 }}
          onError={e => e.target.style.display = "none"}
        />

        {/* Title */}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22,
          color: "#c8a456",
          letterSpacing: 3,
          marginBottom: 4,
        }}>Chance Builders</div>
        <div style={{
          fontSize: 11,
          color: "#6b7592",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 40,
        }}>Builder Login</div>

        {/* Form */}
        <div style={{
          background: "#161b24",
          border: "1px solid #252d3d",
          borderRadius: 12,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 380,
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: "#6b7592", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                style={{
                  width: "100%", background: "#1c2230", border: "1px solid #252d3d",
                  borderRadius: 8, padding: "10px 12px", color: "#e6e2d8",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#c8a456"}
                onBlur={e => e.target.style.borderColor = "#252d3d"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: "#6b7592", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", background: "#1c2230", border: "1px solid #252d3d",
                  borderRadius: 8, padding: "10px 12px", color: "#e6e2d8",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#c8a456"}
                onBlur={e => e.target.style.borderColor = "#252d3d"}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(224,82,82,.1)", border: "1px solid rgba(224,82,82,.2)",
                borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#e05252", marginBottom: 14,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: loading ? "#6b7592" : "#c8a456",
                color: "#0d1117", border: "none", borderRadius: 8,
                padding: "12px", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: ".3px",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Client portal link */}
        <div style={{ marginTop: 28, fontSize: 12, color: "#6b7592", textAlign: "center" }}>
          Are you a client?{" "}
          <a href="/portal" style={{ color: "#c8a456", textDecoration: "none" }}>
            Access Client Portal →
          </a>
        </div>
      </div>
    </>
  );
}
