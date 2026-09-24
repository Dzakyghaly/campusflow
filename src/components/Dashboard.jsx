import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard({ setCurrentPage, activeSemester }) {
  // =========================
  // DATA
  // =========================

  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);

  const [tuition, setTuition] = useState({
    semester: Number(activeSemester),
    totalFee: 0,
    payments: [],
  });

  // =========================
  // AMBIL COURSES DARI SUPABASE
  // =========================

  async function fetchCourses() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Gagal mengambil session:", sessionError);
        setCourses([]);
        return;
      }

      if (!session?.user) {
        setCourses([]);
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester))
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Gagal mengambil courses di dashboard:", error);

        setCourses([]);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("Error fetchCourses Dashboard:", error);

      setCourses([]);
    }
  }

  // =========================
  // AMBIL TASKS DARI SUPABASE
  // =========================

  async function fetchTasks() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Gagal mengambil session:", sessionError);
        setTasks([]);
        return;
      }

      if (!session?.user) {
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal mengambil tasks di dashboard:", error);

        setTasks([]);
        return;
      }

      const formattedTasks = (data || []).map((task) => ({
        ...task,

        deadlineTime: task.deadline_time ? task.deadline_time.slice(0, 5) : "",
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetchTasks Dashboard:", error);

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

      if (sessionError) {
        console.error("Gagal mengambil session:", sessionError);
        setSchedules([]);
        return;
      }

      if (!session?.user) {
        setSchedules([]);
        return;
      }

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester))
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Gagal mengambil schedules di dashboard:", error);

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
      console.error("Error fetchSchedules Dashboard:", error);

      setSchedules([]);
    }
  }

  // =========================
  // AMBIL TUITION DARI SUPABASE
  // =========================

  async function fetchTuition() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Gagal mengambil session:", sessionError);

        setTuition({
          semester: Number(activeSemester),
          totalFee: 0,
          payments: [],
        });

        return;
      }

      if (!session?.user) {
        setTuition({
          semester: Number(activeSemester),
          totalFee: 0,
          payments: [],
        });

        return;
      }

      // =========================
      // TOTAL TAGIHAN
      // =========================

      const { data: tuitionData, error: tuitionError } = await supabase
        .from("tuition")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester))
        .maybeSingle();

      if (tuitionError) {
        console.error("Gagal mengambil tuition di dashboard:", tuitionError);
      }

      // =========================
      // RIWAYAT PEMBAYARAN
      // =========================

      const { data: paymentData, error: paymentError } = await supabase
        .from("tuition_payments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("semester", Number(activeSemester))
        .order("payment_date", { ascending: true });

      if (paymentError) {
        console.error("Gagal mengambil pembayaran di dashboard:", paymentError);
      }

      const formattedPayments = (paymentData || []).map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.payment_date,
        note: payment.note || "",
      }));

      setTuition({
        semester: Number(activeSemester),

        totalFee: Number(tuitionData?.total_fee || 0),

        payments: formattedPayments,
      });
    } catch (error) {
      console.error("Error fetchTuition Dashboard:", error);

      setTuition({
        semester: Number(activeSemester),
        totalFee: 0,
        payments: [],
      });
    }
  }

  // =========================
  // AMBIL DATA PER SEMESTER
  // =========================

  useEffect(() => {
    fetchCourses();
    fetchTasks();
    fetchSchedules();
    fetchTuition();
  }, [activeSemester]);

  // =========================
  // TUITION DATA
  // =========================

  const totalPaid = tuition.payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const remainingTuition = Math.max(tuition.totalFee - totalPaid, 0);

  const tuitionProgress =
    tuition.totalFee === 0
      ? 0
      : Math.min(Math.round((totalPaid / tuition.totalFee) * 100), 100);

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  // =========================
  // TASK DATA
  // =========================

  const activeTasks = tasks.filter((task) => task.status !== "Selesai");

  const completedTasks = tasks.filter((task) => task.status === "Selesai");

  const notStartedTasks = tasks.filter((task) => task.status === "Belum");

  const progressTasks = tasks.filter((task) => task.status === "Proses");

  // =========================
  // TASK PROGRESS
  // =========================

  const progressPercentage =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks.length / tasks.length) * 100);

  // =========================
  // UPCOMING TASKS
  // =========================

  const upcomingTasks = activeTasks
    .filter((task) => task.deadline)
    .sort((a, b) => {
      const dateA = new Date(`${a.deadline}T${a.deadlineTime || "23:59"}`);

      const dateB = new Date(`${b.deadline}T${b.deadlineTime || "23:59"}`);

      return dateA - dateB;
    })
    .slice(0, 3);

  // =========================
  // TODAY
  // =========================

  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const today = dayNames[new Date().getDay()];

  // =========================
  // TODAY SCHEDULE
  // =========================

  const todaySchedules = schedules
    .filter((schedule) => schedule.day === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // =========================
  // NEXT CLASS
  // =========================

  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const nextClass = todaySchedules.find((schedule) => {
    if (!schedule.startTime) {
      return false;
    }

    const [hour, minute] = schedule.startTime.split(":").map(Number);

    const scheduleMinutes = hour * 60 + minute;

    return scheduleMinutes > currentMinutes;
  });

  // =========================
  // DEADLINE
  // =========================

  function getDeadlineText(deadline) {
    const todayDate = new Date();

    todayDate.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline + "T00:00:00");

    const difference = deadlineDate - todayDate;

    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return "Terlambat";
    }

    if (days === 0) {
      return "Hari ini";
    }

    if (days === 1) {
      return "Besok";
    }

    return `${days} hari`;
  }

  // =========================
  // RETURN
  // =========================

  return (
    <section className="dashboard">
      {/* =========================
          SEMESTER INFO
      ========================= */}

      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <span className="section-label">
          DASHBOARD • SEMESTER {activeSemester}
        </span>
      </div>

      {/* =========================
          NEXT CLASS
      ========================= */}

      <div className="next-class-card">
        {nextClass ? (
          <>
            <div>
              <span className="card-label">NEXT CLASS</span>

              <h2>{nextClass.course}</h2>

              <p className="class-info">
                {nextClass.day}
                {" • "}
                {nextClass.startTime}
                {" - "}
                {nextClass.endTime}
                {" • "}
                {nextClass.room}
              </p>
            </div>

            <div className="class-time">
              <span>Kelas berikutnya</span>

              <strong>{nextClass.startTime}</strong>
            </div>
          </>
        ) : (
          <div>
            <span className="card-label">NEXT CLASS</span>

            <h2>Tidak ada kelas berikutnya 🎉</h2>

            <p className="class-info">
              Jadwal kuliah hari ini sudah selesai atau belum ada jadwal
              Semester {activeSemester}.
            </p>
          </div>
        )}
      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="stats-grid">
        <div className="stat-card">
          <span>COURSES</span>

          <h2>{courses.length}</h2>

          <p>Mata kuliah Semester {activeSemester}</p>
        </div>

        <div className="stat-card">
          <span>ACTIVE TASKS</span>

          <h2>{activeTasks.length}</h2>

          <p>Tugas belum selesai</p>
        </div>

        <div className="stat-card">
          <span>IN PROGRESS</span>

          <h2>{progressTasks.length}</h2>

          <p>Sedang dikerjakan</p>
        </div>

        <div className="stat-card">
          <span>COMPLETED</span>

          <h2>{completedTasks.length}</h2>

          <p>Tugas selesai</p>
        </div>
      </div>

      {/* =========================
          CONTENT
      ========================= */}

      <div className="dashboard-grid">
        {/* LEFT */}

        <div className="dashboard-left">
          {/* TODAY SCHEDULE */}

          <div className="dashboard-card">
            <div className="section-header">
              <div>
                <span className="section-label">SCHEDULE</span>

                <h3>Jadwal Hari Ini</h3>
              </div>

              <button
                className="text-button"
                onClick={() => setCurrentPage("schedule")}
              >
                Lihat Semua
              </button>
            </div>

            {todaySchedules.length === 0 ? (
              <div className="dashboard-empty">
                <strong>Tidak ada kelas hari ini</strong>

                <p>
                  Belum ada jadwal hari ini untuk Semester {activeSemester}.
                </p>
              </div>
            ) : (
              <div className="schedule-list">
                {todaySchedules.map((schedule) => (
                  <div className="schedule-item" key={schedule.id}>
                    <div className="schedule-time">
                      <strong>{schedule.startTime}</strong>

                      <span>{schedule.endTime}</span>
                    </div>

                    <div className="schedule-line"></div>

                    <div className="schedule-content">
                      <h4>{schedule.course}</h4>

                      <p>
                        {schedule.room}
                        {" • "}
                        {schedule.lecturer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEADLINES */}

          <div className="dashboard-card">
            <div className="section-header">
              <div>
                <span className="section-label">TASKS</span>

                <h3>Deadline Terdekat</h3>
              </div>

              <button
                className="add-small-button"
                onClick={() => setCurrentPage("tasks")}
              >
                Kelola Tugas
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="dashboard-empty">
                <strong>Tidak ada deadline 🎉</strong>

                <p>Tidak ada tugas aktif Semester {activeSemester}.</p>
              </div>
            ) : (
              <div className="task-list">
                {upcomingTasks.map((task) => (
                  <div className="task-item" key={task.id}>
                    <span
                      className={
                        task.status === "Proses"
                          ? "task-dot yellow"
                          : "task-dot red"
                      }
                    ></span>

                    <div className="task-info">
                      <h4>{task.title}</h4>

                      <p>{task.course}</p>
                    </div>

                    <div
                      className={`task-deadline ${
                        getDeadlineText(task.deadline) === "Terlambat"
                          ? "danger"
                          : ""
                      }`}
                    >
                      <strong>{getDeadlineText(task.deadline)}</strong>

                      <span>
                        {task.deadline}

                        {task.deadlineTime ? ` • ${task.deadlineTime}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}

        <div className="dashboard-right">
          {/* PROGRESS */}

          <div className="dashboard-card">
            <span className="section-label">PRODUCTIVITY</span>

            <h3>Progress Tugas</h3>

            <div className="progress-number">{progressPercentage}%</div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercentage}%`,
                }}
              ></div>
            </div>

            <div className="progress-detail">
              <div>
                <span className="legend red"></span>

                <p>Belum</p>

                <strong>{notStartedTasks.length}</strong>
              </div>

              <div>
                <span className="legend yellow"></span>

                <p>Proses</p>

                <strong>{progressTasks.length}</strong>
              </div>

              <div>
                <span className="legend green"></span>

                <p>Selesai</p>

                <strong>{completedTasks.length}</strong>
              </div>
            </div>
          </div>

          {/* =========================
              TUITION PREVIEW
          ========================= */}

          <div className="dashboard-card tuition-card">
            <div className="section-header">
              <div>
                <span className="section-label">TUITION</span>

                <h3>Pembayaran Kuliah</h3>
              </div>

              <span className="semester-badge">Semester {activeSemester}</span>
            </div>

            <div className="tuition-value">
              <div>
                <span>Sudah Dibayar</span>

                <h2>{formatRupiah(totalPaid)}</h2>
              </div>

              <span className="tuition-percent">{tuitionProgress}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${tuitionProgress}%`,
                }}
              ></div>
            </div>

            <div className="tuition-summary">
              <div>
                <span>Total Tagihan</span>

                <strong>{formatRupiah(tuition.totalFee)}</strong>
              </div>

              <div>
                <span>Sisa Pembayaran</span>

                <strong className={remainingTuition === 0 ? "" : "remaining"}>
                  {formatRupiah(remainingTuition)}
                </strong>
              </div>
            </div>

            <button
              className="tuition-button"
              onClick={() => setCurrentPage("tuition")}
            >
              Lihat Pembayaran
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
