import { useEffect, useRef, useState } from "react";

function Header({ activeSemester, changeSemester, theme, toggleTheme }) {
  // =========================
  // WAKTU SEKARANG
  // =========================

  const [now, setNow] = useState(new Date());

  // =========================
  // NOTIFICATION DROPDOWN
  // =========================

  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  // Update waktu setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown ketika klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================
  // SAPAAN
  // =========================

  const hour = now.getHours();

  let greeting = "Selamat Malam";

  if (hour >= 5 && hour < 11) {
    greeting = "Selamat Pagi";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat Siang";
  } else if (hour >= 15 && hour < 18) {
    greeting = "Selamat Sore";
  }

  const formattedDate = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // =========================
  // PILIH SEMESTER
  // =========================

  function handleSemesterChange(event) {
    changeSemester(event.target.value);
    setShowNotifications(false);
  }

  // =========================
  // AMBIL DATA
  // =========================

  function getTasks() {
    try {
      const savedTasks = localStorage.getItem(
        `campusflow-tasks-semester-${activeSemester}`,
      );

      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch {
      return [];
    }
  }

  function getSchedules() {
    try {
      const savedSchedules = localStorage.getItem(
        `campusflow-schedules-semester-${activeSemester}`,
      );

      return savedSchedules ? JSON.parse(savedSchedules) : [];
    } catch {
      return [];
    }
  }

  // =========================
  // NOTIFIKASI TUGAS
  // =========================

  function getTaskNotifications() {
    const tasks = getTasks();

    return tasks
      .filter((task) => {
        return task.status !== "Selesai" && task.deadline && task.deadlineTime;
      })
      .map((task) => {
        const deadline = new Date(`${task.deadline}T${task.deadlineTime}:00`);

        const difference = deadline.getTime() - now.getTime();

        const minutesLeft = Math.ceil(difference / 60000);

        return {
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          course: task.course,
          time: task.deadlineTime,
          minutesLeft,
        };
      })
      .filter((notification) => {
        return notification.minutesLeft >= 0 && notification.minutesLeft <= 30;
      });
  }

  // =========================
  // NOTIFIKASI JADWAL
  // =========================

  function getScheduleNotifications() {
    const schedules = getSchedules();

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const todayName = dayNames[now.getDay()];

    return schedules
      .filter((schedule) => {
        return schedule.day === todayName && schedule.startTime;
      })
      .map((schedule) => {
        const [hours, minutes] = schedule.startTime.split(":").map(Number);

        const classTime = new Date(now);

        classTime.setHours(hours, minutes, 0, 0);

        const difference = classTime.getTime() - now.getTime();

        const minutesLeft = Math.ceil(difference / 60000);

        return {
          id: `schedule-${schedule.id}`,
          type: "schedule",
          title: schedule.course,
          room: schedule.room,
          time: schedule.startTime,
          minutesLeft,
        };
      })
      .filter((notification) => {
        return notification.minutesLeft >= 0 && notification.minutesLeft <= 30;
      });
  }

  // =========================
  // SEMUA NOTIFIKASI
  // =========================

  const notifications = [
    ...getTaskNotifications(),
    ...getScheduleNotifications(),
  ].sort((a, b) => a.minutesLeft - b.minutesLeft);

  return (
    <header className="header">
      <div>
        <p className="header-date">{formattedDate}</p>

        <h1>{greeting} 👋</h1>
      </div>

      <div className="header-actions">
        {/* THEME */}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={
            theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"
          }
        >
          <span className="theme-icon">{theme === "light" ? "🌙" : "☀️"}</span>
        </button>

        {/* NOTIFICATION */}

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {notifications.length > 0 && (
              <span className="notification-count">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <span>NOTIFICATION CENTER</span>
                  <h3>Notifikasi</h3>
                </div>

                {notifications.length > 0 && (
                  <strong>{notifications.length}</strong>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <div>🔔</div>

                    <strong>Belum ada notifikasi</strong>

                    <p>
                      Tugas dan jadwal yang mendekati waktunya akan muncul di
                      sini.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div className="notification-item" key={notification.id}>
                      <div
                        className={`notification-item-icon ${
                          notification.type === "task"
                            ? "task-notification-icon"
                            : "schedule-notification-icon"
                        }`}
                      >
                        {notification.type === "task" ? "📝" : "📚"}
                      </div>

                      <div className="notification-content">
                        <strong>
                          {notification.type === "task"
                            ? "Deadline Tugas"
                            : "Kelas Akan Dimulai"}
                        </strong>

                        <h4>{notification.title}</h4>

                        {notification.type === "task" && (
                          <p>{notification.course}</p>
                        )}

                        {notification.type === "schedule" &&
                          notification.room && <p>📍 {notification.room}</p>}

                        <span>
                          {notification.minutesLeft === 0
                            ? "Sekarang"
                            : `${notification.minutesLeft} menit lagi`}{" "}
                          • {notification.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}

        <div className="profile">
          <div className="profile-avatar">D</div>

          <div className="profile-info">
            <strong>Mahasiswa</strong>

            <select
              className="semester-select"
              value={activeSemester}
              onChange={handleSemesterChange}
            >
              <option value="1">Semester 1</option>

              <option value="2">Semester 2</option>

              <option value="3">Semester 3</option>

              <option value="4">Semester 4</option>

              <option value="5">Semester 5</option>

              <option value="6">Semester 6</option>

              <option value="7">Semester 7</option>

              <option value="8">Semester 8</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
