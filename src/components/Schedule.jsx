import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Schedule({ activeSemester }) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  // =========================
  // STATE
  // =========================

  const [selectedDay, setSelectedDay] = useState("Senin");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [schedules, setSchedules] = useState([]);

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    course: "",
    lecturer: "",
    room: "",
    day: "Senin",
    startTime: "",
    endTime: "",
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
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error("Gagal mengambil courses:", error);

        setCourses([]);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("Error mengambil courses:", error);

      setCourses([]);
    }
  }

  // =========================
  // AMBIL SCHEDULE DARI SUPABASE
  // =========================

  async function fetchSchedules() {
    try {
      setLoading(true);

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
        .order("start_time", {
          ascending: true,
        });

      if (error) {
        console.error("Gagal mengambil schedules:", error);

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
      console.error("Error mengambil schedules:", error);

      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // AMBIL SEMUA DATA
  // =========================

  async function fetchData() {
    await Promise.all([fetchCourses(), fetchSchedules()]);
  }

  // =========================
  // GANTI SEMESTER
  // =========================

  useEffect(() => {
    fetchData();

    // Kembali ke Senin ketika semester diganti
    setSelectedDay("Senin");

    // Tutup form
    setShowForm(false);

    setEditingId(null);

    setForm({
      course: "",
      lecturer: "",
      room: "",
      day: "Senin",
      startTime: "",
      endTime: "",
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
  // PILIH MATA KULIAH
  // =========================

  function handleCourseChange(event) {
    const selectedCourseName = event.target.value;

    const selectedCourse = courses.find(
      (course) => course.name === selectedCourseName,
    );

    if (!selectedCourse) {
      setForm({
        ...form,
        course: "",
        lecturer: "",
        room: "",
      });

      return;
    }

    setForm({
      ...form,

      course: selectedCourse.name,

      lecturer: selectedCourse.lecturer || "",

      room: selectedCourse.room || "",
    });
  }

  // =========================
  // RESET FORM
  // =========================

  function resetForm() {
    setForm({
      course: "",
      lecturer: "",
      room: "",
      day: selectedDay,
      startTime: "",
      endTime: "",
    });

    setEditingId(null);
  }

  // =========================
  // BUKA FORM TAMBAH
  // =========================

  function openAddForm() {
    setEditingId(null);

    setForm({
      course: "",
      lecturer: "",
      room: "",
      day: selectedDay,
      startTime: "",
      endTime: "",
    });

    setShowForm(true);
  }

  // =========================
  // TUTUP FORM
  // =========================

  function closeForm() {
    setShowForm(false);

    resetForm();
  }

  // =========================
  // SIMPAN JADWAL
  // =========================

  async function saveSchedule(event) {
    event.preventDefault();

    if (
      !form.course ||
      !form.lecturer ||
      !form.room ||
      !form.startTime ||
      !form.endTime
    ) {
      alert("Lengkapi semua data jadwal.");
      return;
    }

    if (form.endTime <= form.startTime) {
      alert("Jam selesai harus setelah jam mulai.");

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

      const scheduleData = {
        user_id: session.user.id,

        semester: Number(activeSemester),

        course: form.course,

        lecturer: form.lecturer,

        room: form.room,

        day: form.day,

        start_time: form.startTime,

        end_time: form.endTime,
      };

      // =========================
      // EDIT JADWAL
      // =========================

      if (editingId !== null) {
        const { error } = await supabase
          .from("schedules")
          .update(scheduleData)
          .eq("id", editingId)
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Gagal mengubah jadwal:", error);

          alert("Gagal mengubah jadwal: " + error.message);

          return;
        }
      }

      // =========================
      // TAMBAH JADWAL
      // =========================
      else {
        const { error } = await supabase.from("schedules").insert(scheduleData);

        if (error) {
          console.error("Gagal menambahkan jadwal:", error);

          alert("Gagal menyimpan jadwal: " + error.message);

          return;
        }
      }

      // Ambil ulang data terbaru
      await fetchSchedules();

      setSelectedDay(form.day);

      setShowForm(false);

      setForm({
        course: "",
        lecturer: "",
        room: "",
        day: form.day,
        startTime: "",
        endTime: "",
      });

      setEditingId(null);
    } catch (error) {
      console.error("Error menyimpan jadwal:", error);

      alert("Terjadi kesalahan saat menyimpan jadwal.");
    }
  }

  // =========================
  // EDIT
  // =========================

  function editSchedule(schedule) {
    setEditingId(schedule.id);

    setForm({
      course: schedule.course,

      lecturer: schedule.lecturer,

      room: schedule.room,

      day: schedule.day,

      startTime: schedule.startTime,

      endTime: schedule.endTime,
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS
  // =========================

  async function deleteSchedule(id) {
    const confirmDelete = window.confirm("Hapus jadwal kuliah ini?");

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
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Gagal menghapus jadwal:", error);

        alert("Gagal menghapus jadwal: " + error.message);

        return;
      }

      await fetchSchedules();
    } catch (error) {
      console.error("Error menghapus jadwal:", error);

      alert("Terjadi kesalahan saat menghapus jadwal.");
    }
  }

  // =========================
  // JADWAL HARI TERPILIH
  // =========================

  const daySchedules = schedules
    .filter((schedule) => schedule.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section className="schedule-page">
      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Smart Schedule</h2>

          <p>Atur jadwal kuliah Semester {activeSemester}.</p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Jadwal
        </button>
      </div>

      {/* =========================
          DAY SELECTOR
      ========================= */}

      <div className="day-selector">
        {days.map((day) => (
          <button
            key={day}
            className={selectedDay === day ? "day-button active" : "day-button"}
            onClick={() => setSelectedDay(day)}
          >
            <span>{day.substring(0, 3)}</span>

            <strong>
              {schedules.filter((schedule) => schedule.day === day).length}
            </strong>
          </button>
        ))}
      </div>

      {/* =========================
          SCHEDULE
      ========================= */}

      <div className="schedule-page-card">
        <div className="schedule-page-title">
          <div>
            <span className="section-label">{selectedDay.toUpperCase()}</span>

            <h3>Jadwal {selectedDay}</h3>
          </div>

          <span>{daySchedules.length} kelas</span>
        </div>

        {loading ? (
          <div className="schedule-empty">
            <div className="schedule-empty-icon">◷</div>

            <h3>Memuat jadwal...</h3>

            <p>Mengambil data jadwal dari CampusFlow.</p>
          </div>
        ) : daySchedules.length === 0 ? (
          <div className="schedule-empty">
            <div className="schedule-empty-icon">◷</div>

            <h3>Belum ada jadwal</h3>

            <p>
              Belum ada jadwal Semester {activeSemester} untuk hari{" "}
              {selectedDay}.
            </p>

            <button onClick={openAddForm}>+ Tambah Jadwal</button>
          </div>
        ) : (
          <div className="weekly-schedule-list">
            {daySchedules.map((schedule, index) => (
              <div className="weekly-schedule-item" key={schedule.id}>
                <div className="schedule-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="weekly-time">
                  <strong>{schedule.startTime}</strong>

                  <span>{schedule.endTime}</span>
                </div>

                <div className="weekly-line">
                  <span></span>
                </div>

                <div className="weekly-course">
                  <h3>{schedule.course}</h3>

                  <div className="course-details">
                    <span>👤 {schedule.lecturer}</span>

                    <span>📍 {schedule.room}</span>
                  </div>
                </div>

                <div className="schedule-actions">
                  <button
                    className="edit-schedule"
                    onClick={() => editSchedule(schedule)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-schedule"
                    onClick={() => deleteSchedule(schedule.id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================
          WEEK SUMMARY
      ========================= */}

      <div className="week-summary">
        <div>
          <span>TOTAL KELAS</span>

          <strong>{schedules.length}</strong>

          <p>Semester {activeSemester}</p>
        </div>

        <div>
          <span>HARI AKTIF</span>

          <strong>
            {new Set(schedules.map((schedule) => schedule.day)).size}
          </strong>

          <p>Hari kuliah</p>
        </div>

        <div>
          <span>HARI TERSIBUK</span>

          <strong>{getBusiestDay(schedules, days)}</strong>

          <p>Jadwal terbanyak</p>
        </div>
      </div>

      {/* =========================
          MODAL
      ========================= */}

      {showForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>{editingId !== null ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveSchedule}>
              {/* =========================
                  MATA KULIAH
              ========================= */}

              <div className="form-group">
                <label>Mata Kuliah</label>

                <select
                  name="course"
                  value={form.course}
                  onChange={handleCourseChange}
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

              {/* =========================
                  DOSEN & RUANGAN
              ========================= */}

              <div className="form-row">
                <div className="form-group">
                  <label>Dosen</label>

                  <input
                    type="text"
                    name="lecturer"
                    value={form.lecturer}
                    onChange={handleChange}
                    placeholder="Nama dosen"
                  />
                </div>

                <div className="form-group">
                  <label>Ruangan</label>

                  <input
                    type="text"
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="Contoh: Lab 3"
                  />
                </div>
              </div>

              {/* =========================
                  HARI
              ========================= */}

              <div className="form-group">
                <label>Hari</label>

                <select name="day" value={form.day} onChange={handleChange}>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* =========================
                  JAM
              ========================= */}

              <div className="form-row">
                <div className="form-group">
                  <label>Jam Mulai</label>

                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Jam Selesai</label>

                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* =========================
                  BUTTON
              ========================= */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Batal
                </button>

                <button type="submit" className="save-button">
                  {editingId !== null ? "Simpan Perubahan" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================
   CARI HARI TERSIBUK
========================= */

function getBusiestDay(schedules, days) {
  if (schedules.length === 0) {
    return "-";
  }

  let busiestDay = "-";
  let highestCount = 0;

  days.forEach((day) => {
    const count = schedules.filter((schedule) => schedule.day === day).length;

    if (count > highestCount) {
      highestCount = count;
      busiestDay = day;
    }
  });

  return busiestDay;
}

export default Schedule;
