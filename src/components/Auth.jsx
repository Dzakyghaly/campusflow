import { useState } from "react";
import { supabase } from "../lib/supabase";

function Auth({ passwordRecovery = false, onRecoveryComplete = () => {} }) {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Khusus reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================
  // MESSAGE
  // =========================

  function showMessage(text, type = "error") {
    setMessage(text);
    setMessageType(type);
  }

  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  // =========================
  // ICONS
  // =========================

  function EmailIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  function LockIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  function EyeIcon({ hidden = false }) {
    if (hidden) {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5 0 9 4 10 8a12.7 12.7 0 0 1-2.1 4.1" />
          <path d="M6.2 6.2A12.2 12.2 0 0 0 2 12c1 4 5 8 10 8a10.5 10.5 0 0 0 3.1-.5" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // =========================
  // LOGIN / REGISTER
  // =========================

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanEmail = email.trim();

    clearMessage();

    if (!cleanEmail || !password) {
      showMessage("Email dan password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      showMessage("Password minimal 6 karakter.");
      return;
    }

    try {
      setLoading(true);

      // =========================
      // REGISTER
      // =========================

      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: "https://campusflow-xi.vercel.app",
          },
        });

        if (error) {
          throw error;
        }

        showMessage(
          "Pendaftaran berhasil. Cek email kamu untuk mengonfirmasi akun.",
          "success",
        );

        setPassword("");
        return;
      }

      // =========================
      // LOGIN
      // =========================

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Auth error:", error);

      if (error.message === "Invalid login credentials") {
        showMessage("Email atau password yang kamu masukkan salah.");
      } else if (error.message === "Email not confirmed") {
        showMessage(
          "Email kamu belum dikonfirmasi. Cek inbox atau kirim ulang email konfirmasi.",
        );
      } else if (
        error.message?.toLowerCase().includes("user already registered")
      ) {
        showMessage("Email ini sudah terdaftar. Silakan masuk.");
      } else {
        showMessage(error.message || "Terjadi masalah. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // GANTI MODE
  // =========================

  function changeMode(newMode) {
    if (loading) return;

    setMode(newMode);
    setPassword("");
    setShowPassword(false);
    clearMessage();
  }

  // =========================
  // KIRIM ULANG KONFIRMASI
  // =========================

  async function resendConfirmation() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showMessage(
        "Masukkan email terlebih dahulu untuk mengirim ulang konfirmasi.",
      );
      return;
    }

    try {
      setLoading(true);
      clearMessage();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: "https://campusflow-xi.vercel.app",
        },
      });

      if (error) {
        throw error;
      }

      showMessage(
        "Email konfirmasi sudah dikirim ulang. Cek inbox atau folder spam.",
        "success",
      );
    } catch (error) {
      console.error("Resend confirmation error:", error);

      showMessage(
        error.message ||
          "Email konfirmasi belum berhasil dikirim. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LUPA PASSWORD
  // =========================

  async function handleForgotPassword() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showMessage(
        "Masukkan email akun kamu terlebih dahulu, lalu klik Lupa Password?",
      );
      return;
    }

    try {
      setLoading(true);
      clearMessage();

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: "https://campusflow-xi.vercel.app/?reset-password=true",
      });

      if (error) {
        throw error;
      }

      showMessage(
        "Link reset password sudah dikirim. Silakan cek email kamu.",
        "success",
      );
    } catch (error) {
      console.error("Forgot password error:", error);

      showMessage(
        error.message ||
          "Link reset password belum berhasil dikirim. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // SIMPAN PASSWORD BARU
  // =========================

  async function handleResetPassword(event) {
    event.preventDefault();

    clearMessage();

    if (!newPassword || !confirmPassword) {
      showMessage("Password baru dan konfirmasi password wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      showMessage("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      showMessage(
        "Password berhasil diperbarui. Kamu akan kembali ke halaman masuk.",
        "success",
      );

      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      // Logout session recovery agar user
      // masuk kembali menggunakan password baru.
      await supabase.auth.signOut();

      window.setTimeout(() => {
        onRecoveryComplete();
      }, 1200);
    } catch (error) {
      console.error("Reset password error:", error);

      showMessage(
        error.message ||
          "Password belum berhasil diperbarui. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // PASSWORD RECOVERY PAGE
  // =========================

  if (passwordRecovery) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-heading">
            <div className="auth-mini-logo">C</div>

            <h1>Buat Password Baru</h1>

            <p>
              Buat password baru untuk akun CampusFlow kamu. Pastikan password
              mudah kamu ingat dan tidak digunakan sembarangan.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="auth-form">
            {/* PASSWORD BARU */}

            <div className="auth-field">
              <label>Password Baru</label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon" aria-hidden="true">
                  <LockIcon />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);

                    if (message) {
                      clearMessage();
                    }
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  title={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </div>

            {/* KONFIRMASI PASSWORD */}

            <div className="auth-field">
              <label>Konfirmasi Password</label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon" aria-hidden="true">
                  <LockIcon />
                </span>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);

                    if (message) {
                      clearMessage();
                    }
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  title={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  <EyeIcon hidden={showConfirmPassword} />
                </button>
              </div>
            </div>

            {/* MESSAGE */}

            {message && (
              <div
                className={`auth-message ${
                  messageType === "success"
                    ? "auth-message-success"
                    : "auth-message-error"
                }`}
              >
                <span>{messageType === "success" ? "✓" : "!"}</span>

                <p>{message}</p>
              </div>
            )}

            {/* SUBMIT */}

            <button className="auth-button" type="submit" disabled={loading}>
              <span>{loading ? "Menyimpan..." : "Simpan Password Baru"}</span>

              {!loading && <span className="auth-button-arrow">→</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================
  // LOGIN / REGISTER PAGE
  // =========================

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* TAB MASUK / DAFTAR */}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => changeMode("login")}
            disabled={loading}
          >
            Masuk
          </button>

          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => changeMode("register")}
            disabled={loading}
          >
            Daftar
          </button>
        </div>

        {/* HEADING */}

        <div className="auth-heading">
          <div className="auth-mini-logo">C</div>

          <h1>
            {mode === "login"
              ? "Selamat Datang Kembali"
              : "Buat Akun CampusFlow"}
          </h1>

          <p>
            {mode === "login"
              ? "Masuk ke akun CampusFlow kamu untuk melanjutkan perjalanan kuliah yang lebih terorganisir."
              : "Daftar dan mulai kelola aktivitas kuliah kamu dalam satu tempat."}
          </p>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* EMAIL */}

          <div className="auth-field">
            <label>Email</label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true">
                <EmailIcon />
              </span>

              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (message) {
                    clearMessage();
                  }
                }}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div className="auth-field">
            <label>Password</label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true">
                <LockIcon />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);

                  if (message) {
                    clearMessage();
                  }
                }}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                disabled={loading}
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                title={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}

          {mode === "login" && (
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-forgot-button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Lupa Password?
              </button>
            </div>
          )}

          {/* MESSAGE */}

          {message && (
            <div
              className={`auth-message ${
                messageType === "success"
                  ? "auth-message-success"
                  : "auth-message-error"
              }`}
            >
              <span>{messageType === "success" ? "✓" : "!"}</span>

              <p>{message}</p>
            </div>
          )}

          {/* SUBMIT */}

          <button className="auth-button" type="submit" disabled={loading}>
            <span>
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
            </span>

            {!loading && <span className="auth-button-arrow">→</span>}
          </button>
        </form>

        {/* LOGIN EXTRA */}

        {mode === "login" && (
          <>
            <div className="auth-divider">
              <span></span>
              <p>atau</p>
              <span></span>
            </div>

            <div className="auth-confirmation-box">
              <div className="auth-confirmation-icon" aria-hidden="true">
                <EmailIcon />
              </div>

              <div className="auth-confirmation-text">
                <strong>Belum menerima email konfirmasi?</strong>

                <span>Kirim ulang link konfirmasi ke email kamu.</span>
              </div>

              <button
                type="button"
                className="auth-resend-button"
                onClick={resendConfirmation}
                disabled={loading}
              >
                ↻ Kirim Ulang
              </button>
            </div>
          </>
        )}

        {/* SWITCH */}

        <div className="auth-bottom-switch">
          <span>
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
          </span>

          <button
            type="button"
            onClick={() => changeMode(mode === "login" ? "register" : "login")}
            disabled={loading}
          >
            {mode === "login" ? "Daftar sekarang" : "Masuk sekarang"}

            <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
