import { useEffect, useState } from "react";

function Attendance({ activeSemester }) {
  // =========================
  // STORAGE PER SEMESTER
  // =========================

  function getStorageKey(semester) {
    return `campusflow-attendance-semester-${semester}`;
  }

  function getAttendanceBySemester(semester) {
    const semesterKey = getStorageKey(semester);

    const savedSemesterAttendance = localStorage.getItem(semesterKey);

    // Jika semester sudah punya data sendiri
    if (savedSemesterAttendance !== null) {
      return JSON.parse(savedSemesterAttendance);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldAttendance = localStorage.getItem("campusflow-attendance");

      if (oldAttendance !== null) {
        const parsedOldAttendance = JSON.parse(oldAttendance);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldAttendance));

        return parsedOldAttendance;
      }
    }

    // Semester baru masih kosong
    return [];
  }

  // =========================
  // DATA PRESENSI
  // =========================

  const [attendance, setAttendance] = useState(() => {
    return getAttendanceBySemester(activeSemester);
  });

  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem(
      `campusflow-courses-semester-${activeSemester}`,
    );

    return savedCourses ? JSON.parse(savedCourses) : [];
  });

  // =========================
  // MODAL
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  // =========================
  // DATA FORM
  // =========================

  const [form, setForm] = useState({
    course: "",
    date: "",
    meeting: "",
    status: "Hadir",
  });

  // =========================
  // GANTI SEMESTER
  // =========================

  useEffect(() => {
    const semesterAttendance = getAttendanceBySemester(activeSemester);

    setAttendance(semesterAttendance);

    // Tutup form ketika semester berubah
    setShowForm(false);
    setEditingId(null);

    setForm({
      course: "",
      date: "",
      meeting: "",
      status: "Hadir",
    });
  }, [activeSemester]);

  // =========================
  // SIMPAN KE LOCAL STORAGE
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(attendance));
  }, [attendance, activeSemester]);

  // =========================
  // INPUT FORM
  // =========================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  // =========================
  // BUKA FORM TAMBAH
  // =========================

  function openAddForm() {
    setEditingId(null);

    setForm({
      course: "",
      date: "",
      meeting: "",
      status: "Hadir",
    });

    setShowForm(true);
  }

  // =========================
  // TUTUP FORM
  // =========================

  function closeForm() {
    setShowForm(false);
    setEditingId(null);

    setForm({
      course: "",
      date: "",
      meeting: "",
      status: "Hadir",
    });
  }

  // =========================
  // SIMPAN PRESENSI
  // =========================

  function saveAttendance(event) {
    event.preventDefault();

    if (!form.course || !form.date || !form.meeting) {
      alert("Lengkapi data presensi terlebih dahulu.");

      return;
    }

    // EDIT
    if (editingId !== null) {
      const updatedAttendance = attendance.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            ...form,
          };
        }

        return item;
      });

      setAttendance(updatedAttendance);
    }

    // TAMBAH DATA BARU
    else {
      const newAttendance = {
        id: Date.now(),
        ...form,
      };

      setAttendance([...attendance, newAttendance]);
    }

    closeForm();
  }

  // =========================
  // EDIT PRESENSI
  // =========================

  function editAttendance(item) {
    setEditingId(item.id);

    setForm({
      course: item.course,
      date: item.date,
      meeting: item.meeting,
      status: item.status,
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS PRESENSI
  // =========================

  function deleteAttendance(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus data presensi ini?",
    );

    if (!confirmDelete) {
      return;
    }

    const remainingAttendance = attendance.filter((item) => item.id !== id);

    setAttendance(remainingAttendance);
  }

  // =========================
  // RINGKASAN PRESENSI
  // =========================

  const totalAttendance = attendance.length;

  const totalPresent = attendance.filter(
    (item) => item.status === "Hadir",
  ).length;

  const totalPermission = attendance.filter(
    (item) => item.status === "Izin",
  ).length;

  const totalSick = attendance.filter((item) => item.status === "Sakit").length;

  const totalAlpha = attendance.filter(
    (item) => item.status === "Alpha",
  ).length;

  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((totalPresent / totalAttendance) * 100)
      : 0;

  return (
    <section className="attendance-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Attendance</h2>

          <p>Pantau dan catat kehadiran Semester {activeSemester}.</p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Presensi
        </button>
      </div>

      {/* RINGKASAN */}

      <div className="attendance-summary">
        <div className="attendance-summary-card">
          <span>Total Pertemuan</span>

          <strong>{totalAttendance}</strong>

          <small>Semester {activeSemester}</small>
        </div>

        <div className="attendance-summary-card present">
          <span>Hadir</span>

          <strong>{totalPresent}</strong>

          <small>Pertemuan hadir</small>
        </div>

        <div className="attendance-summary-card permission">
          <span>Izin / Sakit</span>

          <strong>{totalPermission + totalSick}</strong>

          <small>
            {totalPermission} izin • {totalSick} sakit
          </small>
        </div>

        <div className="attendance-summary-card alpha">
          <span>Alpha</span>

          <strong>{totalAlpha}</strong>

          <small>Tanpa keterangan</small>
        </div>
      </div>

      {/* PERSENTASE */}

      <div className="attendance-progress-card">
        <div className="attendance-progress-header">
          <div>
            <h3>Persentase Kehadiran</h3>

            <p>Berdasarkan data presensi Semester {activeSemester}.</p>
          </div>

          <strong>{attendancePercentage}%</strong>
        </div>

        <div className="attendance-progress">
          <div
            className="attendance-progress-bar"
            style={{
              width: `${attendancePercentage}%`,
            }}
          ></div>
        </div>
      </div>

      {/* DATA PRESENSI */}

      {attendance.length === 0 ? (
        <div className="attendance-empty">
          <div className="attendance-empty-icon">✓</div>

          <h3>Semester {activeSemester} masih kosong</h3>

          <p>Belum ada data kehadiran untuk Semester {activeSemester}.</p>
        </div>
      ) : (
        <div className="attendance-list">
          {attendance.map((item) => (
            <div className="attendance-card" key={item.id}>
              <div className="attendance-card-info">
                <span
                  className={`attendance-status ${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>

                <h3>{item.course}</h3>

                <p>
                  Pertemuan ke-
                  {item.meeting}
                </p>

                <span className="attendance-date">{item.date}</span>
              </div>

              <div className="attendance-actions">
                <button
                  className="attendance-edit"
                  onClick={() => editAttendance(item)}
                >
                  Edit
                </button>

                <button
                  className="attendance-delete"
                  onClick={() => deleteAttendance(item.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}

      {showForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>
                  {editingId !== null ? "Edit Presensi" : "Tambah Presensi"}
                </h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveAttendance}>
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
                      {course.code
                        ? `${course.code} - ${course.name}`
                        : course.name}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <small>
                    Belum ada mata kuliah di Semester {activeSemester}.
                    Tambahkan melalui menu Courses terlebih dahulu.
                  </small>
                )}
              </div>

              {/* TANGGAL */}

              <div className="form-group">
                <label>Tanggal Pertemuan</label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              {/* PERTEMUAN */}

              <div className="form-group">
                <label>Pertemuan Ke</label>

                <input
                  type="number"
                  name="meeting"
                  value={form.meeting}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  min="1"
                />
              </div>

              {/* STATUS */}

              <div className="form-group">
                <label>Status Kehadiran</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Hadir">Hadir</option>

                  <option value="Izin">Izin</option>

                  <option value="Sakit">Sakit</option>

                  <option value="Alpha">Alpha</option>
                </select>
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
                  {editingId !== null ? "Simpan Perubahan" : "Simpan Presensi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Attendance;
