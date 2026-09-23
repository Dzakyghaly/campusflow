import { useEffect, useState } from "react";

function Calendar({ activeSemester }) {
  // =========================
  // STORAGE PER SEMESTER
  // =========================

  function getStorageKey(semester) {
    return `campusflow-calendar-semester-${semester}`;
  }

  function getEventsBySemester(semester) {
    const semesterKey = getStorageKey(semester);

    const savedSemesterEvents = localStorage.getItem(semesterKey);

    // Jika semester ini sudah punya data
    if (savedSemesterEvents !== null) {
      return JSON.parse(savedSemesterEvents);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldEvents = localStorage.getItem("campusflow-calendar");

      if (oldEvents !== null) {
        const parsedOldEvents = JSON.parse(oldEvents);

        localStorage.setItem(semesterKey, JSON.stringify(parsedOldEvents));

        return parsedOldEvents;
      }
    }

    // Semester baru masih kosong
    return [];
  }

  // =========================
  // DATA EVENT
  // =========================

  const [events, setEvents] = useState(() => {
    return getEventsBySemester(activeSemester);
  });

  // =========================
  // FORM
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    type: "Kuliah",
    description: "",
  });

  // =========================
  // SIMPAN LOCAL STORAGE
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(events));
  }, [events, activeSemester]);

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
  // RESET FORM
  // =========================

  function resetForm() {
    setForm({
      title: "",
      date: "",
      type: "Kuliah",
      description: "",
    });

    setEditingId(null);
  }

  // =========================
  // BUKA FORM
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
  // SIMPAN EVENT
  // =========================

  function saveEvent(event) {
    event.preventDefault();

    if (!form.title || !form.date) {
      alert("Nama kegiatan dan tanggal wajib diisi.");

      return;
    }

    // EDIT
    if (editingId !== null) {
      const updatedEvents = events.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...form,
            }
          : item,
      );

      setEvents(updatedEvents);
    }

    // TAMBAH
    else {
      const newEvent = {
        id: Date.now(),
        ...form,
      };

      setEvents([...events, newEvent]);
    }

    closeForm();
  }

  // =========================
  // EDIT
  // =========================

  function editEvent(item) {
    setEditingId(item.id);

    setForm({
      title: item.title,
      date: item.date,
      type: item.type,
      description: item.description || "",
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS
  // =========================

  function deleteEvent(id) {
    const confirmDelete = window.confirm("Hapus kegiatan ini?");

    if (!confirmDelete) {
      return;
    }

    setEvents(events.filter((item) => item.id !== id));
  }

  // =========================
  // URUTKAN TANGGAL
  // =========================

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  // =========================
  // FORMAT TANGGAL
  // =========================

  function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <section className="calendar-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Kalender Akademik</h2>

          <p>Catat kegiatan dan agenda penting Semester {activeSemester}.</p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Kegiatan
        </button>
      </div>

      {/* SUMMARY */}

      <div className="calendar-summary">
        <div>
          <span>TOTAL KEGIATAN</span>

          <strong>{events.length}</strong>

          <p>Semester {activeSemester}</p>
        </div>

        <div>
          <span>KEGIATAN TERDEKAT</span>

          <strong>
            {sortedEvents.length > 0 ? formatDate(sortedEvents[0].date) : "-"}
          </strong>

          <p>Agenda berikutnya</p>
        </div>
      </div>

      {/* EVENT LIST */}

      <div className="calendar-card">
        <div className="calendar-title">
          <div>
            <span className="section-label">EVENTS</span>

            <h3>Daftar Kegiatan</h3>
          </div>

          <span>{events.length} kegiatan</span>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="calendar-empty">
            <div className="calendar-empty-icon">◫</div>

            <h3>Semester {activeSemester} masih kosong</h3>

            <p>Belum ada kegiatan akademik untuk Semester {activeSemester}.</p>

            <button onClick={openAddForm}>+ Tambah Kegiatan</button>
          </div>
        ) : (
          <div className="calendar-event-list">
            {sortedEvents.map((item) => (
              <div className="calendar-event" key={item.id}>
                <div className="event-date">
                  <strong>{new Date(item.date + "T00:00:00").getDate()}</strong>

                  <span>
                    {new Date(item.date + "T00:00:00")
                      .toLocaleDateString("id-ID", {
                        month: "short",
                      })
                      .toUpperCase()}
                  </span>
                </div>

                <div className="event-content">
                  <span className="event-type">{item.type}</span>

                  <h3>{item.title}</h3>

                  <p>{item.description || "Tidak ada keterangan."}</p>
                </div>

                <div className="event-actions">
                  <button
                    className="course-edit"
                    onClick={() => editEvent(item)}
                  >
                    Edit
                  </button>

                  <button
                    className="course-delete"
                    onClick={() => deleteEvent(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}

      {showForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>
                  {editingId !== null ? "Edit Kegiatan" : "Tambah Kegiatan"}
                </h2>
              </div>

              <button type="button" className="close-modal" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveEvent}>
              {/* NAMA KEGIATAN */}

              <div className="form-group">
                <label>Nama Kegiatan</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Contoh: UTS Jaringan Komputer"
                />
              </div>

              {/* TANGGAL */}

              <div className="form-group">
                <label>Tanggal</label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              {/* JENIS */}

              <div className="form-group">
                <label>Jenis Kegiatan</label>

                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="Kuliah">Kuliah</option>

                  <option value="Ujian">Ujian</option>

                  <option value="Presentasi">Presentasi</option>

                  <option value="Seminar">Seminar</option>

                  <option value="Kampus">Kegiatan Kampus</option>

                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* KETERANGAN */}

              <div className="form-group">
                <label>Keterangan</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tambahkan keterangan..."
                  rows="4"
                ></textarea>
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
                  {editingId !== null ? "Simpan Perubahan" : "Simpan Kegiatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Calendar;
