import { useEffect, useState } from "react";

function Courses({ activeSemester }) {
  // =========================
  // STORAGE PER SEMESTER
  // =========================

  function getStorageKey(semester) {
    return `campusflow-courses-semester-${semester}`;
  }

  function getCoursesBySemester(semester) {
    const semesterKey = getStorageKey(semester);

    const savedSemesterCourses = localStorage.getItem(semesterKey);

    // Jika semester sudah punya penyimpanan sendiri
    if (savedSemesterCourses !== null) {
      return JSON.parse(savedSemesterCourses);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldCourses = localStorage.getItem("campusflow-courses");

      if (oldCourses !== null) {
        const parsedOldCourses = JSON.parse(oldCourses);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldCourses));

        return parsedOldCourses;
      }
    }

    // Semester baru masih kosong
    return [];
  }

  // =========================
  // DATA MATA KULIAH
  // =========================

  const [courses, setCourses] = useState(() => {
    return getCoursesBySemester(activeSemester);
  });

  // =========================
  // MODAL
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  // =========================
  // FORM
  // =========================

  const [form, setForm] = useState({
    code: "",
    name: "",
    lecturer: "",
    credits: "",
    room: "",
  });

  // =========================
  // GANTI DATA SAAT
  // SEMESTER BERUBAH
  // =========================

  useEffect(() => {
    const semesterCourses = getCoursesBySemester(activeSemester);

    setCourses(semesterCourses);

    // Tutup form jika semester diganti
    setShowForm(false);
    setEditingId(null);

    setForm({
      code: "",
      name: "",
      lecturer: "",
      credits: "",
      room: "",
    });
  }, [activeSemester]);

  // =========================
  // SIMPAN LOCAL STORAGE
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(courses));
  }, [courses, activeSemester]);

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
  // BUKA FORM TAMBAH
  // =========================

  function openAddForm() {
    setEditingId(null);

    setForm({
      code: "",
      name: "",
      lecturer: "",
      credits: "",
      room: "",
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
      code: "",
      name: "",
      lecturer: "",
      credits: "",
      room: "",
    });
  }

  // =========================
  // SIMPAN MATA KULIAH
  // =========================

  function saveCourse(event) {
    event.preventDefault();

    if (!form.code || !form.name || !form.lecturer || !form.credits) {
      alert("Lengkapi data mata kuliah terlebih dahulu.");

      return;
    }

    // EDIT
    if (editingId !== null) {
      const updatedCourses = courses.map((course) => {
        if (course.id === editingId) {
          return {
            ...course,
            ...form,
            credits: Number(form.credits),
          };
        }

        return course;
      });

      setCourses(updatedCourses);
    }

    // TAMBAH BARU
    else {
      const newCourse = {
        id: Date.now(),
        ...form,
        credits: Number(form.credits),
      };

      setCourses([...courses, newCourse]);
    }

    closeForm();
  }

  // =========================
  // EDIT
  // =========================

  function editCourse(course) {
    setEditingId(course.id);

    setForm({
      code: course.code,
      name: course.name,
      lecturer: course.lecturer,
      credits: course.credits,
      room: course.room,
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS
  // =========================

  function deleteCourse(id) {
    const confirmDelete = window.confirm("Hapus mata kuliah ini?");

    if (!confirmDelete) {
      return;
    }

    const remainingCourses = courses.filter((course) => course.id !== id);

    setCourses(remainingCourses);
  }

  // =========================
  // TOTAL SKS
  // =========================

  const totalCredits = courses.reduce(
    (total, course) => total + Number(course.credits),
    0,
  );

  return (
    <section className="courses-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Mata Kuliah</h2>

          <p>
            Kelola mata kuliah yang kamu ambil pada Semester {activeSemester}.
          </p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Mata Kuliah
        </button>
      </div>

      {/* SUMMARY */}

      <div className="course-summary">
        <div>
          <span>TOTAL MATA KULIAH</span>

          <strong>{courses.length}</strong>

          <p>Semester {activeSemester}</p>
        </div>

        <div>
          <span>TOTAL SKS</span>

          <strong>{totalCredits}</strong>

          <p>SKS Semester {activeSemester}</p>
        </div>
      </div>

      {/* COURSES */}

      {courses.length === 0 ? (
        <div className="course-empty">
          <div className="course-empty-icon">C</div>

          <h3>Semester {activeSemester} masih kosong</h3>

          <p>Belum ada mata kuliah untuk Semester {activeSemester}.</p>

          <button onClick={openAddForm}>+ Tambah Mata Kuliah</button>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.id}>
              <div className="course-card-top">
                <span className="course-code">{course.code}</span>

                <span className="course-credit">{course.credits} SKS</span>
              </div>

              <div className="course-card-content">
                <h3>{course.name}</h3>

                <p>{course.lecturer}</p>
              </div>

              <div className="course-room">
                <span>RUANGAN</span>

                <strong>{course.room || "-"}</strong>
              </div>

              <div className="course-actions">
                <button
                  className="course-edit"
                  onClick={() => editCourse(course)}
                >
                  Edit
                </button>

                <button
                  className="course-delete"
                  onClick={() => deleteCourse(course.id)}
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
                  {editingId !== null
                    ? "Edit Mata Kuliah"
                    : "Tambah Mata Kuliah"}
                </h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveCourse}>
              {/* KODE */}

              <div className="form-group">
                <label>Kode Mata Kuliah</label>

                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Contoh: IF101"
                />
              </div>

              {/* NAMA */}

              <div className="form-group">
                <label>Nama Mata Kuliah</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Pemrograman Dasar"
                />
              </div>

              {/* DOSEN */}

              <div className="form-group">
                <label>Dosen</label>

                <input
                  type="text"
                  name="lecturer"
                  value={form.lecturer}
                  onChange={handleChange}
                  placeholder="Contoh: Pak Budi"
                />
              </div>

              <div className="form-row">
                {/* SKS */}

                <div className="form-group">
                  <label>SKS</label>

                  <select
                    name="credits"
                    value={form.credits}
                    onChange={handleChange}
                  >
                    <option value="">Pilih SKS</option>

                    <option value="1">1 SKS</option>

                    <option value="2">2 SKS</option>

                    <option value="3">3 SKS</option>

                    <option value="4">4 SKS</option>

                    <option value="6">6 SKS</option>
                  </select>
                </div>

                {/* RUANGAN */}

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
                  {editingId !== null
                    ? "Simpan Perubahan"
                    : "Simpan Mata Kuliah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Courses;
