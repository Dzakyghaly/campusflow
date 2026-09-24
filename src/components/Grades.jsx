import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Grades({ activeSemester }) {
  // =========================
  // DATA
  // =========================

  const [grades, setGrades] = useState([]);
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
    credits: "",
    grade: "A",
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
  // AMBIL GRADES
  // =========================

  async function fetchGrades() {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setGrades([]);
        return;
      }

      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Gagal mengambil grades:", error);
        setGrades([]);
        return;
      }

      const formattedGrades = (data || []).map((item) => ({
        id: item.id,
        course: item.course || "",
        credits: Number(item.credits || 0),
        grade: item.grade || "A",
        gradePoint: Number(item.grade_point || 0),
      }));

      setGrades(formattedGrades);
    } catch (error) {
      console.error("Error fetchGrades:", error);
      setGrades([]);
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
      console.error("Error fetchCourses Grades:", error);
      setCourses([]);
    }
  }

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      setShowForm(false);
      setEditingId(null);

      setForm({
        course: "",
        credits: "",
        grade: "A",
      });

      await Promise.all([fetchGrades(), fetchCourses()]);

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
  // PILIH MATA KULIAH
  // =========================

  function handleCourseChange(event) {
    const selectedCourseName = event.target.value;

    const selectedCourse = courses.find(
      (course) => course.name === selectedCourseName,
    );

    if (!selectedCourse) {
      setForm((previous) => ({
        ...previous,
        course: "",
        credits: "",
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      course: selectedCourse.name,
      credits: selectedCourse.credits || "",
    }));
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

    return gradePoints[grade] ?? 0;
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

  async function saveGrade(event) {
    event.preventDefault();

    if (!form.course || !form.credits || !form.grade) {
      alert("Lengkapi data nilai terlebih dahulu.");
      return;
    }

    const credits = Number(form.credits);
    const gradePoint = getGradePoint(form.grade);

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      // =========================
      // EDIT NILAI
      // =========================

      if (editingId !== null) {
        const { error } = await supabase
          .from("grades")
          .update({
            course: form.course,
            credits: credits,
            grade: form.grade,
            grade_point: gradePoint,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Gagal mengedit nilai:", error);

          alert("Gagal menyimpan perubahan: " + error.message);

          return;
        }
      }

      // =========================
      // TAMBAH NILAI
      // =========================
      else {
        const { error } = await supabase.from("grades").insert([
          {
            user_id: user.id,
            semester: Number(activeSemester),
            course: form.course,
            credits: credits,
            grade: form.grade,
            grade_point: gradePoint,
          },
        ]);

        if (error) {
          console.error("Gagal menambah nilai:", error);

          alert("Gagal menyimpan nilai: " + error.message);

          return;
        }
      }

      closeForm();
      await fetchGrades();
    } catch (error) {
      console.error("Error saveGrade:", error);

      alert("Terjadi kesalahan saat menyimpan nilai.");
    }
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

  async function deleteGrade(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus data nilai ini?",
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
        .from("grades")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal menghapus nilai:", error);

        alert("Gagal menghapus nilai: " + error.message);

        return;
      }

      await fetchGrades();
    } catch (error) {
      console.error("Error deleteGrade:", error);

      alert("Terjadi kesalahan saat menghapus nilai.");
    }
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

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="grades-page">
        <div className="page-header">
          <div>
            <span className="section-label">SEMESTER {activeSemester}</span>

            <h2>Grades</h2>

            <p>Memuat data nilai...</p>
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // RETURN
  // =========================

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
              {/* MATA KULIAH */}

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

              {/* JUMLAH SKS */}

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

              {/* NILAI */}

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
