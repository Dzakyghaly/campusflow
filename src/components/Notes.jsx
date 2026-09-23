import { useEffect, useState } from "react";

function Notes({ activeSemester }) {
  // =========================
  // STORAGE PER SEMESTER
  // =========================

  function getStorageKey(semester) {
    return `campusflow-notes-semester-${semester}`;
  }

  function getNotesBySemester(semester) {
    const semesterKey = getStorageKey(semester);

    const savedSemesterNotes = localStorage.getItem(semesterKey);

    // Jika semester sudah punya data sendiri
    if (savedSemesterNotes !== null) {
      return JSON.parse(savedSemesterNotes);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldNotes = localStorage.getItem("campusflow-notes");

      if (oldNotes !== null) {
        const parsedOldNotes = JSON.parse(oldNotes);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldNotes));

        return parsedOldNotes;
      }
    }

    // Semester baru masih kosong
    return [];
  }

  // =========================
  // DATA CATATAN
  // =========================

  const [notes, setNotes] = useState(() => {
    return getNotesBySemester(activeSemester);
  });

  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem(
      `campusflow-courses-semester-${activeSemester}`,
    );

    return savedCourses ? JSON.parse(savedCourses) : [];
  });

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
  // GANTI SEMESTER
  // =========================

  useEffect(() => {
    const semesterNotes = getNotesBySemester(activeSemester);

    setNotes(semesterNotes);

    // Reset pencarian
    setSearch("");

    // Tutup modal
    setShowForm(false);
    setEditingId(null);

    // Reset form
    setForm({
      title: "",
      course: "",
      type: "Catatan",
      content: "",
      link: "",
    });
  }, [activeSemester]);

  // =========================
  // SIMPAN KE LOCAL STORAGE
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(notes));
  }, [notes, activeSemester]);

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

  function saveNote(event) {
    event.preventDefault();

    if (!form.title || !form.course || !form.content) {
      alert("Lengkapi data catatan terlebih dahulu.");

      return;
    }

    // EDIT
    if (editingId !== null) {
      const updatedNotes = notes.map((note) => {
        if (note.id === editingId) {
          return {
            ...note,
            ...form,
          };
        }

        return note;
      });

      setNotes(updatedNotes);
    }

    // TAMBAH CATATAN BARU
    else {
      const newNote = {
        id: Date.now(),
        ...form,
        createdAt: new Date().toISOString(),
      };

      setNotes([...notes, newNote]);
    }

    closeForm();
  }

  // =========================
  // HAPUS CATATAN
  // =========================

  function deleteNote(id) {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus catatan ini?",
    );

    if (!confirmDelete) {
      return;
    }

    const remainingNotes = notes.filter((note) => note.id !== id);

    setNotes(remainingNotes);
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
