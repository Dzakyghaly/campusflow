import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Attendance({ activeSemester }) {
  // =========================
  // DATA
  // =========================

  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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
  // AMBIL USER
  // =========================

  async function getCurrentUser() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Gagal mengambil session:", error);
      return null;
    }

    return session?.user || null;
  }

  // =========================
  // AMBIL ATTENDANCE
  // =========================

  async function fetchAttendance() {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setAttendance([]);
        return;
      }

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("date", { ascending: true })
        .order("meeting", { ascending: true });

      if (error) {
        console.error("Gagal mengambil attendance:", error);
        setAttendance([]);
        return;
      }

      const formattedAttendance = (data || []).map((item) => ({
        id: item.id,
        course: item.course || "",
        date: item.date || "",
        meeting: item.meeting?.toString() || "",
        status: item.status || "Hadir",
      }));

      setAttendance(formattedAttendance);
    } catch (error) {
      console.error("Error fetchAttendance:", error);
      setAttendance([]);
    }
  }

  // =========================
  // AMBIL COURSES
  // =========================

  async function fetchCourses() {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setCourses([]);
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Gagal mengambil courses:", error);
        setCourses([]);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("Error fetchCourses Attendance:", error);
      setCourses([]);
    }
  }

  // =========================
  // LOAD DATA PER SEMESTER
  // =========================

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      setShowForm(false);
      setEditingId(null);

      setForm({
        course: "",
        date: "",
        meeting: "",
        status: "Hadir",
      });

      await Promise.all([fetchAttendance(), fetchCourses()]);

      setLoading(false);
    }

    loadData();
  }, [activeSemester]);

  // =========================
  // INPUT FORM
  // =========================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
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

  async function saveAttendance(event) {
    event.preventDefault();

    if (!form.course || !form.date || !form.meeting) {
      alert("Lengkapi data presensi terlebih dahulu.");
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      // =========================
      // EDIT
      // =========================

      if (editingId !== null) {
        const { error } = await supabase
          .from("attendance")
          .update({
            course: form.course,
            date: form.date,
            meeting: Number(form.meeting),
            status: form.status,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Gagal mengedit presensi:", error);

          alert("Gagal menyimpan perubahan: " + error.message);

          return;
        }
      }

      // =========================
      // TAMBAH BARU
      // =========================
      else {
        const { error } = await supabase.from("attendance").insert([
          {
            user_id: user.id,
            semester: Number(activeSemester),
            course: form.course,
            date: form.date,
            meeting: Number(form.meeting),
            status: form.status,
          },
        ]);

        if (error) {
          console.error("Gagal menambah presensi:", error);

          alert("Gagal menyimpan presensi: " + error.message);

          return;
        }
      }

      closeForm();
      await fetchAttendance();
    } catch (error) {
      console.error("Error saveAttendance:", error);

      alert("Terjadi kesalahan saat menyimpan presensi.");
    }
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

  async function deleteAttendance(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus data presensi ini?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal menghapus presensi:", error);

        alert("Gagal menghapus presensi: " + error.message);

        return;
      }

      await fetchAttendance();
    } catch (error) {
      console.error("Error deleteAttendance:", error);

      alert("Terjadi kesalahan saat menghapus presensi.");
    }
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

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="attendance-page">
        <div className="page-header">
          <div>
            <span className="section-label">SEMESTER {activeSemester}</span>

            <h2>Attendance</h2>

            <p>Memuat data kehadiran...</p>
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // RETURN
  // =========================

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

                <p>Pertemuan ke-{item.meeting}</p>

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
