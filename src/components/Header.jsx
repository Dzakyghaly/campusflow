import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

function Header({ activeSemester, changeSemester, theme, toggleTheme }) {
  // =========================
  // DATA
  // =========================

  const [now, setNow] = useState(new Date());

  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Gagal keluar dari akun: " + error.message);
    }
  };

  // =========================
  // UPDATE WAKTU
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // TUTUP NOTIFIKASI
  // KETIKA KLIK DI LUAR
  // =========================

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
  // AMBIL TASKS DARI SUPABASE
  // =========================

  async function fetchTasks() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester));

      if (error) {
        console.error("Gagal mengambil tasks untuk notifikasi:", error);

        setTasks([]);
        return;
      }

      const formattedTasks = (data || []).map((task) => ({
        ...task,

        deadlineTime: task.deadline_time ? task.deadline_time.slice(0, 5) : "",
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetch tasks notification:", error);

      setTasks([]);
    }
  }

  // =========================
  // AMBIL SCHEDULE DARI SUPABASE
  // =========================

  async function fetchSchedules() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setSchedules([]);
        return;
      }

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester));

      if (error) {
        console.error("Gagal mengambil schedule untuk notifikasi:", error);

        setSchedules([]);
        return;
      }

      const formattedSchedules = (data || []).map((schedule) => ({
        ...schedule,

        startTime: schedule.start_time ? schedule.start_time.slice(0, 5) : "",

        endTime: schedule.end_time ? schedule.end_time.slice(0, 5) : "",
      }));

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("Error fetch schedules notification:", error);

      setSchedules([]);
    }
  }

  // =========================
  // AMBIL DATA NOTIFIKASI
  // =========================

  async function fetchNotificationData() {
    await Promise.all([fetchTasks(), fetchSchedules()]);
  }

  // =========================
  // AMBIL DATA SAAT
  // SEMESTER BERUBAH
  // =========================

  useEffect(() => {
    fetchNotificationData();
  }, [activeSemester]);

  // =========================
  // REFRESH DATA OTOMATIS
  // SETIAP 30 DETIK
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationData();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeSemester]);

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
  // NOTIFIKASI TUGAS
  // =========================

  function getTaskNotifications() {
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

  // =========================
  // RETURN
  // =========================

  return (
    <header className="header">
      <div>
        <p className="header-date">{formattedDate}</p>

        <h1>{greeting} 👋</h1>
      </div>

      <div className="header-actions">
        {/* =========================
            THEME
        ========================= */}

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

        {/* =========================
            NOTIFICATION
        ========================= */}

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

        {/* =========================
            PROFILE
        ========================= */}

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

        {/* =========================
            LOGOUT
        ========================= */}

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          title="Keluar dari akun"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

export default Header;
