import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Calendar({ activeSemester }) {
  // =========================
  // DATA EVENT
  // =========================

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
  // AMBIL USER LOGIN
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
  // AMBIL EVENT DARI SUPABASE
  // =========================

  async function fetchEvents() {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("date", { ascending: true });

      if (error) {
        console.error("Gagal mengambil calendar events:", error);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetchEvents:", error);
      setEvents([]);
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
        title: "",
        date: "",
        type: "Kuliah",
        description: "",
      });

      await fetchEvents();

      setLoading(false);
    }

    loadData();
  }, [activeSemester]);

  // =========================
  // INPUT
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

  async function saveEvent(event) {
    event.preventDefault();

    if (!form.title || !form.date) {
      alert("Nama kegiatan dan tanggal wajib diisi.");
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      // =========================
      // EDIT EVENT
      // =========================

      if (editingId !== null) {
        const { error } = await supabase
          .from("calendar_events")
          .update({
            title: form.title,
            date: form.date,
            type: form.type,
            description: form.description,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Gagal mengedit kegiatan:", error);

          alert("Gagal menyimpan perubahan: " + error.message);

          return;
        }
      }

      // =========================
      // TAMBAH EVENT
      // =========================
      else {
        const { error } = await supabase.from("calendar_events").insert([
          {
            user_id: user.id,
            semester: Number(activeSemester),
            title: form.title,
            date: form.date,
            type: form.type,
            description: form.description,
          },
        ]);

        if (error) {
          console.error("Gagal menambah kegiatan:", error);

          alert("Gagal menyimpan kegiatan: " + error.message);

          return;
        }
      }

      closeForm();

      await fetchEvents();
    } catch (error) {
      console.error("Error saveEvent:", error);

      alert("Terjadi kesalahan saat menyimpan kegiatan.");
    }
  }

  // =========================
  // EDIT EVENT
  // =========================

  function editEvent(item) {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      date: item.date || "",
      type: item.type || "Kuliah",
      description: item.description || "",
    });

    setShowForm(true);
  }

  // =========================
  // HAPUS EVENT
  // =========================

  async function deleteEvent(id) {
    const confirmDelete = window.confirm("Hapus kegiatan ini?");

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
        .from("calendar_events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal menghapus kegiatan:", error);

        alert("Gagal menghapus kegiatan: " + error.message);

        return;
      }

      await fetchEvents();
    } catch (error) {
      console.error("Error deleteEvent:", error);

      alert("Terjadi kesalahan saat menghapus kegiatan.");
    }
  }

  // =========================
  // URUTKAN TANGGAL
  // =========================

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00"),
  );

  // =========================
  // CARI KEGIATAN TERDEKAT
  // =========================

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const upcomingEvents = sortedEvents.filter((item) => {
    const eventDate = new Date(item.date + "T00:00:00");

    return eventDate >= today;
  });

  const nearestEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // =========================
  // FORMAT TANGGAL
  // =========================

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="calendar-page">
        <div className="page-header">
          <div>
            <span className="section-label">SEMESTER {activeSemester}</span>

            <h2>Kalender Akademik</h2>

            <p>Memuat kegiatan...</p>
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // RETURN
  // =========================

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

          <strong>{nearestEvent ? formatDate(nearestEvent.date) : "-"}</strong>

          <p>
            {nearestEvent ? nearestEvent.title : "Belum ada agenda berikutnya"}
          </p>
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
