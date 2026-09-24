import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Notes({ activeSemester }) {
  // =========================
  // DATA
  // =========================

  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // MODAL & SEARCH
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // =========================
  // DATA FORM
  // =========================

  const [form, setForm] = useState({
    title: "",
    course: "",
    type: "Catatan",
    content: "",
    link: "",
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
  // AMBIL NOTES DARI SUPABASE
  // =========================

  async function fetchNotes() {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setNotes([]);
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal mengambil notes:", error);
        setNotes([]);
        return;
      }

      const formattedNotes = (data || []).map((note) => ({
        id: note.id,
        title: note.title || "",
        course: note.course || "",
        type: note.type || "Catatan",
        content: note.content || "",
        link: note.link || "",
        date: note.date || "",
        createdAt: note.created_at,
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetchNotes:", error);
      setNotes([]);
    }
  }

  // =========================
  // AMBIL COURSES DARI SUPABASE
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
      console.error("Error fetchCourses Notes:", error);
      setCourses([]);
    }
  }

  // =========================
  // LOAD DATA PER SEMESTER
  // =========================

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      setSearch("");
      setShowForm(false);
      setEditingId(null);

      setForm({
        title: "",
        course: "",
        type: "Catatan",
        content: "",
        link: "",
      });

      await Promise.all([fetchNotes(), fetchCourses()]);

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
  // RESET FORM
  // =========================

  function resetForm() {
    setForm({
      title: "",
      course: "",
      type: "Catatan",
      content: "",
      link: "",
    });

    setEditingId(null);
  }

  // =========================
  // BUKA FORM TAMBAH
  // =========================

  function openAddForm() {
    resetForm();
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
  // SIMPAN CATATAN
  // =========================

  async function saveNote(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.course || !form.content.trim()) {
      alert("Lengkapi data catatan terlebih dahulu.");
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      // =========================
      // EDIT CATATAN
      // =========================

      if (editingId !== null) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: form.title.trim(),
            course: form.course,
            type: form.type,
            content: form.content.trim(),
            link: form.link.trim() || null,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Gagal mengedit catatan:", error);

          alert("Gagal menyimpan perubahan: " + error.message);

          return;
        }
      }

      // =========================
      // TAMBAH CATATAN
      // =========================
      else {
        const today = new Date().toISOString().split("T")[0];

        const { error } = await supabase.from("notes").insert([
          {
            user_id: user.id,
            semester: Number(activeSemester),
            title: form.title.trim(),
            course: form.course,
            type: form.type,
            content: form.content.trim(),
            link: form.link.trim() || null,
            date: today,
          },
        ]);

        if (error) {
          console.error("Gagal menambah catatan:", error);

          alert("Gagal menyimpan catatan: " + error.message);

          return;
        }
      }

      closeForm();

      await fetchNotes();
    } catch (error) {
      console.error("Error saveNote:", error);

      alert("Terjadi kesalahan saat menyimpan catatan.");
    }
  }

  // =========================
  // HAPUS CATATAN
  // =========================

  async function deleteNote(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus catatan ini?",
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
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal menghapus catatan:", error);

        alert("Gagal menghapus catatan: " + error.message);

        return;
      }

      await fetchNotes();
    } catch (error) {
      console.error("Error deleteNote:", error);

      alert("Terjadi kesalahan saat menghapus catatan.");
    }
  }

  // =========================
  // EDIT CATATAN
  // =========================

  function editNote(note) {
    setEditingId(note.id);

    setForm({
      title: note.title,
      course: note.course,
      type: note.type,
      content: note.content,
      link: note.link || "",
    });

    setShowForm(true);
  }

  // =========================
  // PENCARIAN
  // =========================

  const filteredNotes = notes.filter((note) => {
    const keyword = search.toLowerCase();

    return (
      note.title.toLowerCase().includes(keyword) ||
      note.course.toLowerCase().includes(keyword) ||
      note.type.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword)
    );
  });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="notes-page">
        <div className="page-header">
          <div>
            <span className="section-label">SEMESTER {activeSemester}</span>

            <h2>Notes & Materials</h2>

            <p>Memuat catatan...</p>
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // RETURN
  // =========================

  return (
    <section className="notes-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Notes & Materials</h2>

          <p>
            Simpan catatan dan materi Semester {activeSemester} dalam satu
            tempat.
          </p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Catatan
        </button>
      </div>

      {/* SEARCH */}

      <div className="notes-search">
        <span className="notes-search-icon">⌕</span>

        <input
          type="text"
          placeholder={`Cari catatan Semester ${activeSemester}...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* NOTES */}

      {notes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">✎</div>

          <h3>Semester {activeSemester} masih kosong</h3>

          <p>Belum ada catatan atau materi untuk Semester {activeSemester}.</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">⌕</div>

          <h3>Catatan tidak ditemukan</h3>

          <p>Tidak ada catatan yang cocok dengan pencarian "{search}".</p>
        </div>
      ) : (
        <div className="notes-list">
          {filteredNotes.map((note) => (
            <div className="note-card" key={note.id}>
              <div className="note-card-top">
                <span className="note-type">{note.type}</span>

                <span className="note-course">{note.course}</span>
              </div>

              <h3>{note.title}</h3>

              <p className="note-content">{note.content}</p>

              {note.link && (
                <a
                  href={note.link}
                  target="_blank"
                  rel="noreferrer"
                  className="note-link"
                >
                  Buka Materi ↗
                </a>
              )}

              <div className="note-actions">
                <button className="note-edit" onClick={() => editNote(note)}>
                  Edit
                </button>

                <button
                  className="note-delete"
                  onClick={() => deleteNote(note.id)}
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
                  {editingId !== null ? "Edit Catatan" : "Tambah Catatan"}
                </h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveNote}>
              {/* JUDUL */}

              <div className="form-group">
                <label>Judul Catatan</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Contoh: Materi Pertemuan 1"
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

              {/* JENIS */}

              <div className="form-group">
                <label>Jenis</label>

                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="Catatan">Catatan</option>

                  <option value="Materi">Materi</option>

                  <option value="Rangkuman">Rangkuman</option>

                  <option value="Link">Link Materi</option>
                </select>
              </div>

              {/* ISI */}

              <div className="form-group">
                <label>Isi Catatan</label>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Tulis catatan kuliah di sini..."
                  rows="6"
                ></textarea>
              </div>

              {/* LINK */}

              <div className="form-group">
                <label>Link Materi</label>

                <input
                  type="url"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  placeholder="https://..."
                />
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
                  {editingId !== null ? "Simpan Perubahan" : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Notes;
