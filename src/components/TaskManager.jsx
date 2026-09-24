import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function TaskManager({ activeSemester }) {
  // =========================
  // DATA
  // =========================

  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FORM
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    course: "",
    deadline: "",
    deadlineTime: "",
    priority: "Sedang",
    status: "Belum",
  });

  // =========================
  // AMBIL DATA SUPABASE
  // =========================

  async function fetchData() {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Gagal mengambil session:", sessionError);
        setTasks([]);
        setCourses([]);
        return;
      }

      if (!session?.user) {
        setTasks([]);
        setCourses([]);
        return;
      }

      const userId = session.user.id;
      const semester = Number(activeSemester);

      // =========================
      // AMBIL COURSES
      // =========================

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .eq("semester", semester)
        .order("created_at", { ascending: true });

      if (courseError) {
        console.error("Gagal mengambil courses:", courseError);
        setCourses([]);
      } else {
        setCourses(courseData || []);
      }

      // =========================
      // AMBIL TASKS
      // =========================

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("semester", semester)
        .order("created_at", { ascending: false });

      if (taskError) {
        console.error("Gagal mengambil tasks:", taskError);
        setTasks([]);
      } else {
        const formattedTasks = (taskData || []).map((task) => ({
          ...task,
          deadlineTime: task.deadline_time
            ? task.deadline_time.slice(0, 5)
            : "",
        }));

        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Error mengambil data Task Manager:", error);

      setTasks([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // GANTI SEMESTER
  // =========================

  useEffect(() => {
    fetchData();

    setShowForm(false);

    setForm({
      title: "",
      course: "",
      deadline: "",
      deadlineTime: "",
      priority: "Sedang",
      status: "Belum",
    });
  }, [activeSemester]);

  // =========================
  // INPUT
  // =========================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  // =========================
  // BUKA FORM
  // =========================

  function openAddForm() {
    setForm({
      title: "",
      course: "",
      deadline: "",
      deadlineTime: "",
      priority: "Sedang",
      status: "Belum",
    });

    setShowForm(true);
  }

  // =========================
  // TUTUP FORM
  // =========================

  function closeForm() {
    setShowForm(false);

    setForm({
      title: "",
      course: "",
      deadline: "",
      deadlineTime: "",
      priority: "Sedang",
      status: "Belum",
    });
  }

  // =========================
  // TAMBAH TUGAS
  // =========================

  async function addTask(event) {
    event.preventDefault();

    if (!form.title || !form.course || !form.deadline || !form.deadlineTime) {
      alert("Lengkapi data tugas dan waktu deadline terlebih dahulu.");
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        user_id: session.user.id,
        semester: Number(activeSemester),
        title: form.title,
        course: form.course,
        deadline: form.deadline,
        deadline_time: form.deadlineTime,
        priority: form.priority,
        status: form.status,
      });

      if (error) {
        console.error("Gagal menambahkan tugas:", error);
        alert("Gagal menyimpan tugas: " + error.message);
        return;
      }

      await fetchData();

      closeForm();
    } catch (error) {
      console.error("Error menambahkan tugas:", error);
      alert("Terjadi kesalahan saat menyimpan tugas.");
    }
  }

  // =========================
  // UBAH STATUS
  // =========================

  async function changeStatus(id, newStatus) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
        })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Gagal mengubah status tugas:", error);
        alert("Gagal mengubah status tugas: " + error.message);
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error mengubah status:", error);
      alert("Terjadi kesalahan saat mengubah status tugas.");
    }
  }

  // =========================
  // HAPUS
  // =========================

  async function deleteTask(id) {
    const confirmDelete = window.confirm("Hapus tugas ini?");

    if (!confirmDelete) {
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Gagal menghapus tugas:", error);
        alert("Gagal menghapus tugas: " + error.message);
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error menghapus tugas:", error);
      alert("Terjadi kesalahan saat menghapus tugas.");
    }
  }

  // =========================
  // FILTER
  // =========================

  const activeTasks = tasks.filter((task) => task.status !== "Selesai");

  const completedTasks = tasks.filter((task) => task.status === "Selesai");

  return (
    <section className="task-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Task Manager</h2>

          <p>Kelola tugas dan deadline Semester {activeSemester}.</p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Tugas
        </button>
      </div>

      {/* SUMMARY */}

      <div className="task-summary">
        <div className="summary-card">
          <span>Total Tugas</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="summary-card red-summary">
          <span>Belum</span>
          <strong>
            {tasks.filter((task) => task.status === "Belum").length}
          </strong>
        </div>

        <div className="summary-card yellow-summary">
          <span>Proses</span>
          <strong>
            {tasks.filter((task) => task.status === "Proses").length}
          </strong>
        </div>

        <div className="summary-card green-summary">
          <span>Selesai</span>
          <strong>{completedTasks.length}</strong>
        </div>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="empty-task">
          <h3>Memuat tugas...</h3>
          <p>Mengambil data dari CampusFlow.</p>
        </div>
      ) : (
        <>
          {/* ACTIVE TASKS */}

          <div className="task-section">
            <div className="task-section-title">
              <div>
                <span className="section-label">ACTIVE</span>
                <h3>Tugas Aktif</h3>
              </div>

              <span>{activeTasks.length} tugas</span>
            </div>

            {activeTasks.length === 0 ? (
              <div className="empty-task">
                <div className="empty-icon">✓</div>

                <h3>Tidak ada tugas aktif</h3>

                <p>Belum ada tugas aktif untuk Semester {activeSemester}.</p>
              </div>
            ) : (
              <div className="task-manager-list">
                {activeTasks.map((task) => (
                  <div className="task-manager-card" key={task.id}>
                    <div
                      className={`status-indicator ${
                        task.status === "Belum" ? "status-red" : "status-yellow"
                      }`}
                    ></div>

                    <div className="task-main-info">
                      <div className="task-top">
                        <div>
                          <h3>{task.title}</h3>
                          <p>{task.course}</p>
                        </div>

                        <span
                          className={`priority-badge priority-${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="task-meta">
                        <span>
                          Deadline: {task.deadline}
                          {task.deadlineTime ? ` • ${task.deadlineTime}` : ""}
                        </span>

                        <span>Status: {task.status}</span>
                      </div>

                      <div className="task-actions">
                        {task.status === "Belum" && (
                          <button
                            className="process-button"
                            onClick={() => changeStatus(task.id, "Proses")}
                          >
                            Mulai Kerjakan
                          </button>
                        )}

                        {task.status === "Proses" && (
                          <button
                            className="complete-button"
                            onClick={() => changeStatus(task.id, "Selesai")}
                          >
                            ✓ Tandai Selesai
                          </button>
                        )}

                        <button
                          className="delete-button"
                          onClick={() => deleteTask(task.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORY */}

          <div className="task-section history-section">
            <div className="task-section-title">
              <div>
                <span className="section-label">HISTORY</span>

                <h3>Riwayat Tugas</h3>
              </div>

              <span>{completedTasks.length} selesai</span>
            </div>

            {completedTasks.length === 0 ? (
              <p className="history-empty">
                Belum ada tugas yang selesai pada Semester {activeSemester}.
              </p>
            ) : (
              completedTasks.map((task) => (
                <div className="history-task" key={task.id}>
                  <div className="history-check">✓</div>

                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.course}</span>
                  </div>

                  <button onClick={() => deleteTask(task.id)}>Hapus</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* MODAL */}

      {showForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>Tambah Tugas</h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={addTask}>
              {/* NAMA TUGAS */}

              <div className="form-group">
                <label>Nama Tugas</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Contoh: Laporan Praktikum"
                />
              </div>

              {/* MATA KULIAH */}

              <div className="form-group">
                <label>Mata Kuliah</label>

                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                >
                  <option value="">Pilih Mata Kuliah</option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <p className="form-helper">
                    Belum ada mata kuliah di Semester {activeSemester}.
                    Tambahkan terlebih dahulu melalui menu Courses.
                  </p>
                )}
              </div>

              {/* DEADLINE */}

              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Deadline</label>

                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Jam Deadline</label>

                  <input
                    type="time"
                    name="deadlineTime"
                    value={form.deadlineTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* STATUS & PRIORITAS */}

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Belum">Belum</option>
                    <option value="Proses">Proses</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioritas</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="Rendah">Rendah</option>

                    <option value="Sedang">Sedang</option>

                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              {/* BUTTON */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Batal
                </button>

                <button type="submit" className="save-button">
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskManager;
