import { useEffect, useState } from "react";

function Grades({ activeSemester }) {
  // =========================
  // AMBIL DATA NILAI
  // BERDASARKAN SEMESTER
  // =========================

  const getStorageKey = (semester) => {
    return `campusflow-grades-semester-${semester}`;
  };

  const getGradesBySemester = (semester) => {
    const semesterKey = getStorageKey(semester);
    const savedSemesterGrades = localStorage.getItem(semesterKey);

    // Kalau semester tersebut sudah punya data,
    // gunakan data semester itu.
    if (savedSemesterGrades !== null) {
      return JSON.parse(savedSemesterGrades);
    }

    // Migrasi data lama ke Semester 1.
    // Ini hanya dilakukan jika Semester 1
    // belum mempunyai penyimpanan sendiri.
    if (semester === "1") {
      const oldGrades = localStorage.getItem("campusflow-grades");

      if (oldGrades !== null) {
        const parsedOldGrades = JSON.parse(oldGrades);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldGrades));

        return parsedOldGrades;
      }
    }

    // Semester baru dimulai kosong.
    return [];
  };

  // =========================
  // DATA NILAI
  // =========================

  const [grades, setGrades] = useState(() => {
    return getGradesBySemester(activeSemester);
  });

  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem(
      `campusflow-courses-semester-${activeSemester}`,
    );

    return savedCourses ? JSON.parse(savedCourses) : [];
  });

  // =========================
  // GANTI DATA SAAT
  // SEMESTER BERUBAH
  // =========================

  useEffect(() => {
    const semesterGrades = getGradesBySemester(activeSemester);

    setGrades(semesterGrades);
  }, [activeSemester]);

  // =========================
  // SIMPAN DATA NILAI
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(grades));
  }, [grades, activeSemester]);

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
    credits: "",
    grade: "A",
  });

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

  function handleCourseChange(event) {
    const selectedCourseName = event.target.value;

    const selectedCourse = courses.find(
      (course) => course.name === selectedCourseName,
    );

    if (!selectedCourse) {
      setForm({
        ...form,
        course: "",
        credits: "",
      });

      return;
    }

    setForm({
      ...form,
      course: selectedCourse.name,
      credits: selectedCourse.credits || "",
    });
  }

  // =========================
  // KONVERSI NILAI KE BOBOT
  // =========================

  function getGradePoint(grade) {
    const gradePoints = {
      A: 4,
      B: 3,
      C: 2,
      D: 1,
      E: 0,
    };

    return gradePoints[grade];
  }

  // =========================
  // BUKA FORM TAMBAH
  // =========================

  function openAddForm() {
    setEditingId(null);

    setForm({
      course: "",
      credits: "",
      grade: "A",
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
      credits: "",
      grade: "A",
    });
  }

  // =========================
  // SIMPAN NILAI
  // =========================

  function saveGrade(event) {
    event.preventDefault();

    if (!form.course || !form.credits || !form.grade) {
      alert("Lengkapi data nilai terlebih dahulu.");
      return;
    }

    const credits = Number(form.credits);
    const gradePoint = getGradePoint(form.grade);

    // EDIT NILAI
    if (editingId !== null) {
      const updatedGrades = grades.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            course: form.course,
            credits: credits,
            grade: form.grade,
            gradePoint: gradePoint,
          };
        }

        return item;
      });

      setGrades(updatedGrades);
    }

    // TAMBAH NILAI
    else {
      const newGrade = {
        id: Date.now(),
        course: form.course,
        credits: credits,
        grade: form.grade,
        gradePoint: gradePoint,
      };

      setGrades([...grades, newGrade]);
    }

    closeForm();
  }

  // =========================
  // EDIT NILAI
  // =========================

  function editGrade(item) {
    setEditingId(item.id);

    setForm({
      course: item.course,
      credits: item.credits,
      grade: item.grade,
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS NILAI
  // =========================

  function deleteGrade(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus data nilai ini?",
    );

    if (!confirmDelete) {
      return;
    }

    const remainingGrades = grades.filter((item) => item.id !== id);

    setGrades(remainingGrades);
  }

  // =========================
  // PERHITUNGAN IP SEMESTER
  // =========================

  const totalCourses = grades.length;

  const totalCredits = grades.reduce(
    (total, item) => total + Number(item.credits),
    0,
  );

  const totalQualityPoints = grades.reduce(
    (total, item) => total + Number(item.credits) * Number(item.gradePoint),
    0,
  );

  const semesterGPA = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return (
    <section className="grades-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Grades</h2>

          <p>
            Kelola nilai Semester {activeSemester} dan pantau perkembangan
            akademikmu.
          </p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Nilai
        </button>
      </div>

      {/* RINGKASAN AKADEMIK */}

      <div className="grades-summary">
        <div className="grades-summary-card">
          <span>Mata Kuliah</span>

          <strong>{totalCourses}</strong>

          <small>Semester {activeSemester}</small>
        </div>

        <div className="grades-summary-card">
          <span>Total SKS</span>

          <strong>{totalCredits}</strong>

          <small>SKS yang dihitung</small>
        </div>

        <div className="grades-summary-card">
          <span>Total Mutu</span>

          <strong>{totalQualityPoints.toFixed(2)}</strong>

          <small>SKS × bobot nilai</small>
        </div>

        <div className="grades-summary-card gpa">
          <span>IP Semester</span>

          <strong>{semesterGPA.toFixed(2)}</strong>

          <small>Semester {activeSemester}</small>
        </div>
      </div>

      {/* DATA NILAI */}

      {grades.length === 0 ? (
        <div className="grades-empty">
          <div className="grades-empty-icon">A</div>

          <h3>Semester {activeSemester} masih kosong</h3>

          <p>Belum ada data nilai untuk Semester {activeSemester}.</p>
        </div>
      ) : (
        <div className="grades-list">
          {grades.map((item) => (
            <div className="grade-card" key={item.id}>
              <div className="grade-card-info">
                <div className="grade-letter">{item.grade}</div>

                <div>
                  <h3>{item.course}</h3>

                  <p>{item.credits} SKS</p>
                </div>
              </div>

              <div className="grade-card-right">
                <div className="grade-point">
                  <span>Bobot</span>

                  <strong>{Number(item.gradePoint).toFixed(2)}</strong>
                </div>

                <div className="grade-actions">
                  <button
                    className="grade-edit"
                    onClick={() => editGrade(item)}
                  >
                    Edit
                  </button>

                  <button
                    className="grade-delete"
                    onClick={() => deleteGrade(item.id)}
                  >
                    Hapus
                  </button>
                </div>
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

                <h2>{editingId !== null ? "Edit Nilai" : "Tambah Nilai"}</h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveGrade}>
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

              <div className="form-group">
                <label>Jumlah SKS</label>

                <input
                  type="number"
                  name="credits"
                  value={form.credits}
                  onChange={handleChange}
                  placeholder="Contoh: 3"
                  min="1"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label>Nilai</label>

                <select name="grade" value={form.grade} onChange={handleChange}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Batal
                </button>

                <button type="submit" className="save-button">
                  {editingId !== null ? "Simpan Perubahan" : "Simpan Nilai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Grades;
