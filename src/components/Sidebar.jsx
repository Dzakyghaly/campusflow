function Sidebar({
  currentPage,
  setCurrentPage,
  mobileMenuOpen,
  closeMobileMenu,
}) {
  return (
    <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-logo">C</div>

        <div className="brand-text">
          <h2>CampusFlow</h2>
          <span>Student Workspace</span>
        </div>

        <button
          type="button"
          className="mobile-close-button"
          onClick={closeMobileMenu}
          aria-label="Tutup menu"
        >
          ×
        </button>
      </div>

      <nav className="menu">
        <p className="menu-title">OVERVIEW</p>

        <button
          className={`menu-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => setCurrentPage("dashboard")}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <p className="menu-title">ACADEMIC</p>

        <button
          className={`menu-item ${currentPage === "courses" ? "active" : ""}`}
          onClick={() => setCurrentPage("courses")}
        >
          <span>▣</span>
          Courses
        </button>

        <button
          className={`menu-item ${currentPage === "tasks" ? "active" : ""}`}
          onClick={() => setCurrentPage("tasks")}
        >
          <span>✓</span>
          Tasks
        </button>

        <button
          className={`menu-item ${currentPage === "schedule" ? "active" : ""}`}
          onClick={() => setCurrentPage("schedule")}
        >
          <span>□</span>
          Schedule
        </button>

        <button
          className={`menu-item ${currentPage === "calendar" ? "active" : ""}`}
          onClick={() => setCurrentPage("calendar")}
        >
          <span>▦</span>
          Calendar
        </button>

        <button
          className={`menu-item ${currentPage === "notes" ? "active" : ""}`}
          onClick={() => setCurrentPage("notes")}
        >
          <span>▤</span>
          Notes
        </button>

        <p className="menu-title">CAMPUS</p>

        <button
          className={`menu-item ${
            currentPage === "attendance" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("attendance")}
        >
          <span>✓</span>
          Attendance
        </button>

        <button
          className={`menu-item ${currentPage === "grades" ? "active" : ""}`}
          onClick={() => setCurrentPage("grades")}
        >
          <span>A</span>
          Grades
        </button>

        <button
          className={`menu-item ${currentPage === "tuition" ? "active" : ""}`}
          onClick={() => setCurrentPage("tuition")}
        >
          <span>Rp</span>
          Tuition
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button className="menu-item">
          <span>⚙</span>
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
