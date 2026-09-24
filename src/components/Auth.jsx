import { useState } from "react";
import { supabase } from "../lib/supabase";

function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Email dan password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          "Pendaftaran berhasil. Silakan cek email untuk konfirmasi akun.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email) {
      setMessage("Masukkan email terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: "https://campusflow-xi.vercel.app",
        },
      });

      if (error) throw error;

      setMessage(
        "Email konfirmasi baru sudah dikirim. Silakan cek inbox atau folder spam.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setMessage("");
    setPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">C</div>

        <h1>CampusFlow</h1>
        <p className="auth-subtitle">Your Student Workspace</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && <div className="auth-message">{message}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}

          <button type="button" onClick={changeMode}>
            {mode === "login" ? " Daftar" : " Masuk"}
          </button>
        </p>
        {mode === "login" && (
          <p className="auth-switch">
            Belum menerima email konfirmasi?{" "}
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={loading}
            >
              Kirim Ulang Email
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Auth;
