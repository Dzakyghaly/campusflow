import { useEffect, useState } from "react";

function TaskManager({ activeSemester }) {
  // =========================
  // STORAGE KEY
  // =========================

  function getTaskStorageKey(semester) {
    return `campusflow-tasks-semester-${semester}`;
  }

  function getCourseStorageKey(semester) {
    return `campusflow-courses-semester-${semester}`;
  }

  // =========================
  // AMBIL TUGAS PER SEMESTER
  // =========================

  function getTasksBySemester(semester) {
    const semesterKey = getTaskStorageKey(semester);

    const savedSemesterTasks = localStorage.getItem(semesterKey);

    if (savedSemesterTasks !== null) {
      return JSON.parse(savedSemesterTasks);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldTasks = localStorage.getItem("campusflow-tasks");

      if (oldTasks !== null) {
        const parsedOldTasks = JSON.parse(oldTasks);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldTasks));

        return parsedOldTasks;
      }
    }

    return [];
  }

  // =========================
  // AMBIL COURSES PER SEMESTER
  // =========================

  function getCoursesBySemester(semester) {
    const semesterKey = getCourseStorageKey(semester);

    const savedCourses = localStorage.getItem(semesterKey);

    if (savedCourses !== null) {
      return JSON.parse(savedCourses);
    }

    // Cadangan data lama Semester 1
    if (semester === "1") {
      const oldCourses = localStorage.getItem("campusflow-courses");

      if (oldCourses !== null) {
        return JSON.parse(oldCourses);
      }
    }

    return [];
  }

  // =========================
  // DATA
  // =========================

  const [courses, setCourses] = useState(() => {
    return getCoursesBySemester(activeSemester);
  });

  const [tasks, setTasks] = useState(() => {
    return getTasksBySemester(activeSemester);
  });

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
  // GANTI SEMESTER
  // =========================

  useEffect(() => {
    const semesterTasks = getTasksBySemester(activeSemester);

    const semesterCourses = getCoursesBySemester(activeSemester);

    setTasks(semesterTasks);
    setCourses(semesterCourses);

    // Reset form supaya data semester lama
    // tidak terbawa ke semester baru
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
  // SIMPAN TUGAS
  // =========================

  useEffect(() => {
    const semesterKey = getTaskStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(tasks));
  }, [tasks, activeSemester]);

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

  function addTask(event) {
    event.preventDefault();

    if (!form.title || !form.course || !form.deadline || !form.deadlineTime) {
      alert("Lengkapi data tugas dan waktu deadline terlebih dahulu.");

      return;
    }

    const newTask = {
      id: Date.now(),
      ...form,
    };

    setTasks([...tasks, newTask]);

    closeForm();
  }

  // =========================
  // UBAH STATUS
  // =========================

  function changeStatus(id, newStatus) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return {
          ...task,
          status: newStatus,
        };
      }

      return task;
    });

    setTasks(updatedTasks);
  }

  // =========================
  // HAPUS
  // =========================

  function deleteTask(id) {
    const confirmDelete = window.confirm("Hapus tugas ini?");

    if (!confirmDelete) {
      return;
    }

    const remainingTasks = tasks.filter((task) => task.id !== id);

    setTasks(remainingTasks);
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
