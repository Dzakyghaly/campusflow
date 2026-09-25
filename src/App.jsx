import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TaskManager from "./components/TaskManager";
import Schedule from "./components/Schedule";
import Tuition from "./components/Tuition";
import Courses from "./components/Courses";
import Calendar from "./components/Calendar";
import Notes from "./components/Notes";
import Attendance from "./components/Attendance";
import Grades from "./components/Grades";
import Settings from "./components/Settings";
import Auth from "./components/Auth";

function App() {
  // =========================
  // AUTH
  // =========================

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Menandai bahwa user sedang
  // membuka link recovery password
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    const params = new URLSearchParams(window.location.search);

    return params.get("reset-password") === "true";
  });

  useEffect(() => {
    let mounted = true;

    // =========================
    // CEK SESSION AWAL
    // =========================

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setAuthLoading(false);
    }

    checkSession();

    // =========================
    // DENGARKAN PERUBAHAN AUTH
    // =========================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);

      // Supabase mengirim event ini
      // ketika user membuka link reset password
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }

      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // SELESAI RESET PASSWORD
  // =========================

  function finishPasswordRecovery() {
    setIsPasswordRecovery(false);

    const url = new URL(window.location.href);

    url.searchParams.delete("reset-password");

    window.history.replaceState(
      {},
      document.title,
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  // =========================
  // HALAMAN AKTIF
  // =========================

  const [currentPage, setCurrentPage] = useState("dashboard");

  // =========================
  // SIDEBAR MOBILE
  // =========================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // =========================
  // SEMESTER AKTIF
  // =========================

  const [activeSemester, setActiveSemester] = useState(() => {
    const savedSemester = localStorage.getItem("campusflow-active-semester");

    if (
      savedSemester &&
      Number(savedSemester) >= 1 &&
      Number(savedSemester) <= 8
    ) {
      return String(savedSemester);
    }

    return "1";
  });

  // =========================
  // THEME
  // =========================

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("campusflow-theme");

    return savedTheme || "light";
  });

  useEffect(() => {
    localStorage.setItem("campusflow-theme", theme);

    document.body.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  // =========================
  // GANTI SEMESTER
  // =========================

  function changeSemester(semester) {
    setActiveSemester(semester);

    localStorage.setItem("campusflow-active-semester", semester);
  }

  // =========================
  // GANTI HALAMAN
  // =========================

  function changePage(page) {
    setCurrentPage(page);

    // Sidebar otomatis tertutup
    // setelah memilih menu di HP/tablet
    setMobileMenuOpen(false);
  }

  // =========================
  // TAMPILKAN HALAMAN
  // =========================

  function renderPage() {
    if (currentPage === "tasks") {
      return (
        <TaskManager key={activeSemester} activeSemester={activeSemester} />
      );
    }

    if (currentPage === "schedule") {
      return <Schedule key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "tuition") {
      return <Tuition key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "courses") {
      return <Courses key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "calendar") {
      return <Calendar key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "notes") {
      return <Notes key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "attendance") {
      return (
        <Attendance key={activeSemester} activeSemester={activeSemester} />
      );
    }

    if (currentPage === "grades") {
      return <Grades key={activeSemester} activeSemester={activeSemester} />;
    }

    if (currentPage === "settings") {
      return (
        <Settings
          activeSemester={activeSemester}
          changeSemester={changeSemester}
        />
      );
    }

    return (
      <Dashboard
        key={activeSemester}
        setCurrentPage={changePage}
        activeSemester={activeSemester}
      />
    );
  }

  // =========================
  // LOADING AUTH
  // =========================

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-loading">
            <div className="auth-loading-logo">C</div>

            <h2>CampusFlow</h2>

            <p>Memuat Student Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // PASSWORD RECOVERY
  // =========================

  if (isPasswordRecovery) {
    return (
      <Auth passwordRecovery onRecoveryComplete={finishPasswordRecovery} />
    );
  }

  // =========================
  // BELUM LOGIN
  // =========================

  if (!session) {
    return <Auth />;
  }

  // =========================
  // CAMPUSFLOW
  // =========================

  return (
    <div className={`app-layout ${theme === "dark" ? "dark-mode" : ""}`}>
      {/* =========================
          OVERLAY SIDEBAR MOBILE
      ========================= */}

      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* =========================
          SIDEBAR
      ========================= */}

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={changePage}
        mobileMenuOpen={mobileMenuOpen}
        closeMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="main-content">
        {/* =========================
            MOBILE TOPBAR
        ========================= */}

        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Buka menu"
          >
            ☰
          </button>

          <div className="mobile-brand">
            <div className="mobile-brand-logo">C</div>

            <div className="mobile-brand-info">
              <strong>CampusFlow</strong>
              <span>Student Workspace</span>
            </div>
          </div>
        </div>

        {/* =========================
            HEADER
        ========================= */}

        <Header
          activeSemester={activeSemester}
          changeSemester={changeSemester}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* =========================
            HALAMAN
        ========================= */}

        {renderPage()}
      </main>
    </div>
  );
}

export default App;
