import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const EMPTY_FORM = {
  title: "",
  course: "",
  deadline: "",
  deadlineTime: "",
  priority: "Sedang",
  status: "Belum",
  referenceLink: "",
};

function TaskManager({ activeSemester }) {
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [savingTask, setSavingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [resultTask, setResultTask] = useState(null);
  const [resultFile, setResultFile] = useState(null);
  const [uploadingResult, setUploadingResult] = useState(false);

  // Modal penyelesaian tugas
  const [finishTask, setFinishTask] = useState(null);
  const [finalNote, setFinalNote] = useState("");
  const [finishingTask, setFinishingTask] = useState(false);

  function resetForm() {
    setForm(EMPTY_FORM);
    setAssignmentFile(null);
  }

  function sanitizeFileName(fileName) {
    return fileName
      .normalize("NFKD")
      .replace(/[^\w.\-() ]+/g, "")
      .replace(/\s+/g, "-");
  }

  function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function getFileExtension(fileName) {
    if (!fileName || !fileName.includes(".")) return "FILE";

    return fileName.split(".").pop().toUpperCase();
  }

  function isValidUrl(value) {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  // =========================
  // AMBIL DATA
  // =========================

  async function fetchData() {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setTasks([]);
        setCourses([]);
        return;
      }

      const userId = session.user.id;
      const semester = Number(activeSemester);

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .eq("semester", semester)
        .order("created_at", { ascending: true });

      if (courseError) {
        console.error("Gagal mengambil courses:", courseError);
        setCourses([]);
      } else {
        setCourses(courseData || []);
      }

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("semester", semester)
        .order("created_at", { ascending: false });

      if (taskError) {
        console.error("Gagal mengambil tasks:", taskError);
        setTasks([]);
        return;
      }

      const formattedTasks = (taskData || []).map((task) => ({
        ...task,

        deadlineTime: task.deadline_time ? task.deadline_time.slice(0, 5) : "",

        finalNote: task.description || "",
        referenceLink: task.reference_link || "",

        assignmentFileName: task.assignment_file_name || "",
        assignmentFilePath: task.assignment_file_path || "",

        resultFileName: task.result_file_name || "",
        resultFilePath: task.result_file_path || "",
      }));

      setTasks(formattedTasks);

      if (selectedTask) {
        const updatedSelectedTask = formattedTasks.find(
          (task) => task.id === selectedTask.id,
        );

        if (updatedSelectedTask) {
          setSelectedTask(updatedSelectedTask);
        }
      }
    } catch (error) {
      console.error("Error Task Manager:", error);

      setTasks([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    setShowForm(false);
    setShowDetail(false);
    setSelectedTask(null);

    setResultTask(null);
    setResultFile(null);

    setFinishTask(null);
    setFinalNote("");

    resetForm();
  }, [activeSemester]);

  // =========================
  // FORM
  // =========================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    if (savingTask) return;

    setShowForm(false);
    resetForm();
  }

  // =========================
  // STORAGE
  // =========================

  async function uploadFile({ file, userId, taskId, category }) {
    if (!file) {
      return {
        fileName: "",
        filePath: "",
      };
    }

    const safeName = sanitizeFileName(file.name) || `file-${Date.now()}`;

    const uniqueName = `${Date.now()}-${safeName}`;

    const filePath = `${userId}/tasks/${taskId}/${category}/${uniqueName}`;

    const { error } = await supabase.storage
      .from("task-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      fileName: file.name,
      filePath,
    };
  }

  async function openPrivateFile(filePath) {
    if (!filePath) {
      alert("File tidak ditemukan.");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("task-files")
        .createSignedUrl(filePath, 600);

      if (error) {
        alert("Gagal membuka file: " + error.message);
        return;
      }

      if (!data?.signedUrl) {
        alert("Link file tidak berhasil dibuat.");
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuka file.");
    }
  }

  // =========================
  // TAMBAH TUGAS
  // =========================

  async function addTask(event) {
    event.preventDefault();

    if (!form.title || !form.course || !form.deadline || !form.deadlineTime) {
      alert("Lengkapi nama tugas, mata kuliah, tanggal, dan jam deadline.");
      return;
    }

    if (!isValidUrl(form.referenceLink)) {
      alert(
        "Link referensi tidak valid. Gunakan link yang diawali http:// atau https://",
      );
      return;
    }

    try {
      setSavingTask(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const userId = session.user.id;

      const { data: newTask, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          semester: Number(activeSemester),

          title: form.title.trim(),
          course: form.course,

          deadline: form.deadline,
          deadline_time: form.deadlineTime,

          priority: form.priority,
          status: form.status,

          // Catatan akhir belum diisi saat membuat tugas
          description: null,

          reference_link: form.referenceLink.trim() || null,

          assignment_file_name: null,
          assignment_file_path: null,

          result_file_name: null,
          result_file_path: null,
        })
        .select()
        .single();

      if (insertError) {
        alert("Gagal menyimpan tugas: " + insertError.message);
        return;
      }

      // Upload lampiran dari dosen jika ada
      if (assignmentFile) {
        try {
          const uploaded = await uploadFile({
            file: assignmentFile,
            userId,
            taskId: newTask.id,
            category: "assignment",
          });

          const { error: updateError } = await supabase
            .from("tasks")
            .update({
              assignment_file_name: uploaded.fileName,
              assignment_file_path: uploaded.filePath,
            })
            .eq("id", newTask.id)
            .eq("user_id", userId);

          if (updateError) throw updateError;
        } catch (error) {
          console.error(error);

          alert("Tugas berhasil dibuat, tetapi lampiran gagal di-upload.");
        }
      }

      await fetchData();

      window.dispatchEvent(new Event("campusflow-notifications-updated"));

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);

      alert("Terjadi kesalahan saat menyimpan tugas.");
    } finally {
      setSavingTask(false);
    }
  }

  // =========================
  // STATUS → PROSES
  // =========================

  async function startTask(task) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          status: "Proses",
        })
        .eq("id", task.id)
        .eq("user_id", session.user.id);

      if (error) {
        alert("Gagal mengubah status tugas: " + error.message);
        return;
      }

      await fetchData();

      window.dispatchEvent(new Event("campusflow-notifications-updated"));

      if (selectedTask?.id === task.id) {
        setSelectedTask((previous) => ({
          ...previous,
          status: "Proses",
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memulai tugas.");
    }
  }

  // =========================
  // UPLOAD HASIL
  // =========================

  function openResultUpload(task) {
    setResultTask(task);
    setResultFile(null);
  }

  function closeResultUpload() {
    if (uploadingResult) return;

    setResultTask(null);
    setResultFile(null);
  }

  async function uploadResultFile(event) {
    event.preventDefault();

    if (!resultTask || !resultFile) {
      alert("Pilih file hasil pengerjaan terlebih dahulu.");
      return;
    }

    try {
      setUploadingResult(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const userId = session.user.id;

      const uploaded = await uploadFile({
        file: resultFile,
        userId,
        taskId: resultTask.id,
        category: "result",
      });

      const oldPath = resultTask.resultFilePath;

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          result_file_name: uploaded.fileName,
          result_file_path: uploaded.filePath,
        })
        .eq("id", resultTask.id)
        .eq("user_id", userId);

      if (updateError) {
        await supabase.storage.from("task-files").remove([uploaded.filePath]);

        throw updateError;
      }

      // Hapus hasil lama kalau file diganti
      if (oldPath && oldPath !== uploaded.filePath) {
        const { error: removeError } = await supabase.storage
          .from("task-files")
          .remove([oldPath]);

        if (removeError) {
          console.error("File hasil lama gagal dihapus:", removeError);
        }
      }

      await fetchData();

      window.dispatchEvent(new Event("campusflow-notifications-updated"));

      setResultTask(null);
      setResultFile(null);

      alert("Hasil pengerjaan berhasil disimpan.");
    } catch (error) {
      console.error(error);

      alert(
        "Gagal upload hasil pengerjaan: " + (error.message || "Unknown error"),
      );
    } finally {
      setUploadingResult(false);
    }
  }

  // =========================
  // SELESAIKAN TUGAS
  // =========================

  function openFinishTask(task) {
    setFinishTask(task);

    // Kalau pernah ada catatan, tampilkan kembali
    setFinalNote(task.finalNote || "");
  }

  function closeFinishTask() {
    if (finishingTask) return;

    setFinishTask(null);
    setFinalNote("");
  }

  async function completeTask(event) {
    event.preventDefault();

    if (!finishTask) return;

    try {
      setFinishingTask(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          status: "Selesai",

          // description sekarang kita gunakan
          // sebagai CATATAN AKHIR
          description: finalNote.trim() || null,
        })
        .eq("id", finishTask.id)
        .eq("user_id", session.user.id);

      if (error) {
        alert("Gagal menyelesaikan tugas: " + error.message);
        return;
      }

      setFinishTask(null);
      setFinalNote("");

      setShowDetail(false);
      setSelectedTask(null);

      await fetchData();

      window.dispatchEvent(new Event("campusflow-notifications-updated"));

      alert("Tugas selesai dan sudah dipindahkan ke Riwayat Tugas.");
    } catch (error) {
      console.error(error);

      alert("Terjadi kesalahan saat menyelesaikan tugas.");
    } finally {
      setFinishingTask(false);
    }
  }

  // =========================
  // DETAIL
  // =========================

  function openDetail(task) {
    setSelectedTask(task);
    setShowDetail(true);
  }

  function closeDetail() {
    setSelectedTask(null);
    setShowDetail(false);
  }

  function openReferenceLink(link) {
    if (!link) return;

    if (!isValidUrl(link)) {
      alert("Link referensi tidak valid.");
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
  }

  // =========================
  // HAPUS
  // =========================

  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Hapus tugas "${task.title}"?\n\nLampiran dan hasil pengerjaan juga akan dihapus.`,
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      const paths = [task.assignmentFilePath, task.resultFilePath].filter(
        Boolean,
      );

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("task-files")
          .remove(paths);

        if (storageError) {
          console.error(storageError);

          const continueDelete = window.confirm(
            "File tidak berhasil dihapus dari Storage. Tetap hapus data tugas?",
          );

          if (!continueDelete) return;
        }
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", session.user.id);

      if (error) {
        alert("Gagal menghapus tugas: " + error.message);
        return;
      }

      if (selectedTask?.id === task.id) {
        closeDetail();
      }

      await fetchData();

      window.dispatchEvent(new Event("campusflow-notifications-updated"));
    } catch (error) {
      console.error(error);

      alert("Terjadi kesalahan saat menghapus tugas.");
    }
  }

  // =========================
  // FILTER
  // =========================

  const activeTasks = tasks.filter((task) => task.status !== "Selesai");

  const completedTasks = tasks.filter((task) => task.status === "Selesai");

  return (
    <section className="task-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Task Manager</h2>

          <p>
            Kelola tugas, deadline, lampiran, hasil pengerjaan, dan riwayat
            tugas Semester {activeSemester}.
          </p>
        </div>

        <button className="primary-task-button" onClick={openAddForm}>
          + Tambah Tugas
        </button>
      </div>

      {/* SUMMARY */}

      <div className="task-summary">
        <div className="summary-card">
          <span>Total Tugas</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="summary-card red-summary">
          <span>Belum</span>

          <strong>
            {tasks.filter((task) => task.status === "Belum").length}
          </strong>
        </div>

        <div className="summary-card yellow-summary">
          <span>Proses</span>

          <strong>
            {tasks.filter((task) => task.status === "Proses").length}
          </strong>
        </div>

        <div className="summary-card green-summary">
          <span>Selesai</span>

          <strong>{completedTasks.length}</strong>
        </div>
      </div>

      {/* CONTENT */}

      {loading ? (
        <div className="empty-task">
          <h3>Memuat tugas...</h3>
          <p>Mengambil data dari CampusFlow.</p>
        </div>
      ) : (
        <>
          {/* ACTIVE */}

          <div className="task-section">
            <div className="task-section-title">
              <div>
                <span className="section-label">ACTIVE</span>
                <h3>Tugas Aktif</h3>
              </div>

              <span>{activeTasks.length} tugas</span>
            </div>

            {activeTasks.length === 0 ? (
              <div className="empty-task">
                <div className="empty-icon">✓</div>

                <h3>Tidak ada tugas aktif</h3>

                <p>Belum ada tugas aktif untuk Semester {activeSemester}.</p>
              </div>
            ) : (
              <div className="task-manager-list">
                {activeTasks.map((task) => (
                  <div className="task-manager-card" key={task.id}>
                    <div
                      className={`status-indicator ${
                        task.status === "Belum" ? "status-red" : "status-yellow"
                      }`}
                    />

                    <div className="task-main-info">
                      <div className="task-top">
                        <div>
                          <h3>{task.title}</h3>
                          <p>{task.course}</p>
                        </div>

                        <span
                          className={`priority-badge priority-${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="task-meta">
                        <span>
                          Deadline: {formatDate(task.deadline)}
                          {task.deadlineTime ? ` • ${task.deadlineTime}` : ""}
                        </span>

                        <span>Status: {task.status}</span>
                      </div>

                      {(task.referenceLink ||
                        task.assignmentFileName ||
                        task.resultFileName) && (
                        <div className="task-extra-preview">
                          {task.referenceLink && <span>🔗 Link Referensi</span>}

                          {task.assignmentFileName && (
                            <span>📎 Lampiran Tugas</span>
                          )}

                          {task.resultFileName && (
                            <span>📁 Hasil Tersimpan</span>
                          )}
                        </div>
                      )}

                      <div className="task-actions">
                        <button
                          className="detail-task-button"
                          onClick={() => openDetail(task)}
                        >
                          Lihat Detail
                        </button>

                        {task.status === "Belum" && (
                          <button
                            className="process-button"
                            onClick={() => startTask(task)}
                          >
                            Mulai Kerjakan
                          </button>
                        )}

                        {task.status === "Proses" && (
                          <>
                            <button
                              className="upload-result-button"
                              onClick={() => openResultUpload(task)}
                            >
                              {task.resultFileName
                                ? "Ganti Hasil"
                                : "Upload Hasil"}
                            </button>

                            <button
                              className="complete-button"
                              onClick={() => openFinishTask(task)}
                            >
                              ✓ Selesaikan Tugas
                            </button>
                          </>
                        )}

                        <button
                          className="delete-button"
                          onClick={() => deleteTask(task)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORY */}

          <div className="task-section history-section">
            <div className="task-section-title">
              <div>
                <span className="section-label">HISTORY</span>
                <h3>Riwayat Tugas</h3>
              </div>

              <span>{completedTasks.length} selesai</span>
            </div>

            {completedTasks.length === 0 ? (
              <p className="history-empty">
                Belum ada tugas yang selesai pada Semester {activeSemester}.
              </p>
            ) : (
              completedTasks.map((task) => (
                <div className="history-task" key={task.id}>
                  <div className="history-check">✓</div>

                  <div className="history-task-info">
                    <strong>{task.title}</strong>
                    <span>{task.course}</span>
                  </div>

                  <div className="history-actions">
                    <button
                      className="history-detail-button"
                      onClick={() => openDetail(task)}
                    >
                      Lihat Detail
                    </button>

                    <button
                      className="history-delete-button"
                      onClick={() => deleteTask(task)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ==================================
          MODAL TAMBAH TUGAS
      ================================== */}

      {showForm && (
        <div className="modal-overlay">
          <div className="task-modal task-modal-large">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>Tambah Tugas</h2>

                <p className="task-modal-subtitle">
                  Simpan informasi tugas dan bahan dari dosen.
                </p>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeForm}
                disabled={savingTask}
              >
                ×
              </button>
            </div>

            <form onSubmit={addTask}>
              <div className="form-group">
                <label>Nama Tugas *</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Contoh: Laporan Praktikum"
                  disabled={savingTask}
                />
              </div>

              <div className="form-group">
                <label>Mata Kuliah *</label>

                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  disabled={savingTask}
                >
                  <option value="">Pilih Mata Kuliah</option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <p className="form-helper">
                    Belum ada mata kuliah di Semester {activeSemester}.
                  </p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Deadline *</label>

                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    disabled={savingTask}
                  />
                </div>

                <div className="form-group">
                  <label>Jam Deadline *</label>

                  <input
                    type="time"
                    name="deadlineTime"
                    value={form.deadlineTime}
                    onChange={handleChange}
                    disabled={savingTask}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={savingTask}
                  >
                    <option value="Belum">Belum</option>
                    <option value="Proses">Proses</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioritas</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    disabled={savingTask}
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>🔗 Link Referensi</label>

                <input
                  type="url"
                  name="referenceLink"
                  value={form.referenceLink}
                  onChange={handleChange}
                  placeholder="https://youtube.com/... atau https://drive.google.com/..."
                  disabled={savingTask}
                />

                <p className="form-helper">
                  Opsional — link materi, Google Drive, YouTube, website, atau
                  referensi lainnya.
                </p>
              </div>

              <div className="form-group">
                <label>📎 Lampiran Tugas</label>

                <input
                  type="file"
                  onChange={(event) =>
                    setAssignmentFile(event.target.files?.[0] || null)
                  }
                  disabled={savingTask}
                />

                {assignmentFile && (
                  <div className="selected-task-file">
                    <span>{getFileExtension(assignmentFile.name)}</span>

                    <div>
                      <strong>{assignmentFile.name}</strong>

                      <small>
                        {(assignmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>
                  </div>
                )}

                <p className="form-helper">
                  Opsional — lampiran soal, materi, PDF, Word, PowerPoint,
                  gambar, dan lainnya.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                  disabled={savingTask}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={savingTask}
                >
                  {savingTask ? "Menyimpan..." : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================
          UPLOAD HASIL
      ================================== */}

      {resultTask && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">HASIL PENGERJAAN</span>

                <h2>Upload Hasil Tugas</h2>

                <p className="task-modal-subtitle">{resultTask.title}</p>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeResultUpload}
              >
                ×
              </button>
            </div>

            <form onSubmit={uploadResultFile}>
              {resultTask.resultFileName && (
                <div className="current-result-file">
                  <span>FILE SAAT INI</span>

                  <strong>{resultTask.resultFileName}</strong>

                  <button
                    type="button"
                    onClick={() => openPrivateFile(resultTask.resultFilePath)}
                  >
                    Buka File
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>📁 File Hasil Pengerjaan</label>

                <input
                  type="file"
                  onChange={(event) =>
                    setResultFile(event.target.files?.[0] || null)
                  }
                />

                <p className="form-helper">
                  Opsional untuk alur tugas secara umum. Kamu tetap bisa
                  menyelesaikan tugas tanpa file jika tugas tersebut memang
                  tidak menghasilkan dokumen.
                </p>
              </div>

              {resultFile && (
                <div className="selected-task-file">
                  <span>{getFileExtension(resultFile.name)}</span>

                  <div>
                    <strong>{resultFile.name}</strong>

                    <small>
                      {(resultFile.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeResultUpload}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={uploadingResult}
                >
                  {uploadingResult ? "Mengupload..." : "Simpan Hasil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================
          SELESAIKAN TUGAS + CATATAN AKHIR
      ================================== */}

      {finishTask && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SELESAIKAN TUGAS</span>

                <h2>{finishTask.title}</h2>

                <p className="task-modal-subtitle">
                  Periksa hasil pengerjaan dan tambahkan catatan akhir sebelum
                  tugas disimpan ke History.
                </p>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeFinishTask}
                disabled={finishingTask}
              >
                ×
              </button>
            </div>

            <form onSubmit={completeTask}>
              {/* HASIL PENGERJAAN */}

              <div className="task-detail-section">
                <span className="task-detail-label">📁 HASIL PENGERJAAN</span>

                {finishTask.resultFilePath ? (
                  <div className="task-resource-card">
                    <div>
                      <strong>{finishTask.resultFileName}</strong>

                      <span>File hasil sudah tersimpan.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPrivateFile(finishTask.resultFilePath)}
                    >
                      Buka File
                    </button>
                  </div>
                ) : (
                  <p className="task-detail-empty">
                    Tidak ada file hasil pengerjaan. Tugas tetap dapat
                    diselesaikan jika memang tidak membutuhkan file hasil.
                  </p>
                )}
              </div>

              {/* CATATAN AKHIR */}

              <div className="form-group">
                <label>📝 Catatan Akhir</label>

                <textarea
                  value={finalNote}
                  onChange={(event) => setFinalNote(event.target.value)}
                  rows="5"
                  placeholder="Contoh: Tugas sudah dikumpulkan melalui LMS, materi sudah dipahami, revisi sudah selesai..."
                  disabled={finishingTask}
                />

                <p className="form-helper">
                  Opsional — catatan ini akan ikut tersimpan di Riwayat Tugas.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeFinishTask}
                  disabled={finishingTask}
                >
                  Kembali
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={finishingTask}
                >
                  {finishingTask
                    ? "Menyimpan..."
                    : "✓ Selesai & Simpan ke History"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================
          DETAIL TUGAS / HISTORY
      ================================== */}

      {showDetail && selectedTask && (
        <div className="modal-overlay">
          <div className="task-modal task-modal-large">
            <div className="modal-header">
              <div>
                <span className="section-label">DETAIL TUGAS</span>

                <h2>{selectedTask.title}</h2>

                <p className="task-modal-subtitle">{selectedTask.course}</p>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeDetail}
              >
                ×
              </button>
            </div>

            <div className="detail-status-row">
              <span>
                Status: <strong>{selectedTask.status}</strong>
              </span>

              <span
                className={`priority-badge priority-${selectedTask.priority.toLowerCase()}`}
              >
                {selectedTask.priority}
              </span>
            </div>

            <div className="task-detail-grid">
              <div>
                <span>MATA KULIAH</span>
                <strong>{selectedTask.course}</strong>
              </div>

              <div>
                <span>DEADLINE</span>

                <strong>
                  {formatDate(selectedTask.deadline)}
                  {selectedTask.deadlineTime
                    ? ` • ${selectedTask.deadlineTime}`
                    : ""}
                </strong>
              </div>
            </div>

            {/* LINK */}

            <div className="task-detail-section">
              <span className="task-detail-label">🔗 LINK REFERENSI</span>

              {selectedTask.referenceLink ? (
                <div className="task-resource-card">
                  <div>
                    <strong>Referensi Tugas</strong>
                    <span>{selectedTask.referenceLink}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openReferenceLink(selectedTask.referenceLink)
                    }
                  >
                    Buka Link
                  </button>
                </div>
              ) : (
                <p className="task-detail-empty">Tidak ada link referensi.</p>
              )}
            </div>

            {/* LAMPIRAN */}

            <div className="task-detail-section">
              <span className="task-detail-label">📎 LAMPIRAN TUGAS</span>

              {selectedTask.assignmentFilePath ? (
                <div className="task-resource-card">
                  <div>
                    <strong>{selectedTask.assignmentFileName}</strong>

                    <span>Lampiran / materi tugas</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openPrivateFile(selectedTask.assignmentFilePath)
                    }
                  >
                    Buka File
                  </button>
                </div>
              ) : (
                <p className="task-detail-empty">Tidak ada lampiran tugas.</p>
              )}
            </div>

            {/* HASIL */}

            <div className="task-detail-section">
              <span className="task-detail-label">📁 HASIL PENGERJAAN</span>

              {selectedTask.resultFilePath ? (
                <div className="task-resource-card">
                  <div>
                    <strong>{selectedTask.resultFileName}</strong>

                    <span>File hasil pengerjaan</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPrivateFile(selectedTask.resultFilePath)}
                  >
                    Buka File
                  </button>
                </div>
              ) : (
                <p className="task-detail-empty">
                  Belum ada file hasil pengerjaan.
                </p>
              )}
            </div>

            {/* CATATAN AKHIR HANYA JIKA ADA */}

            {(selectedTask.status === "Selesai" || selectedTask.finalNote) && (
              <div className="task-detail-section">
                <span className="task-detail-label">📝 CATATAN AKHIR</span>

                {selectedTask.finalNote ? (
                  <p className="task-description-text">
                    {selectedTask.finalNote}
                  </p>
                ) : (
                  <p className="task-detail-empty">Tidak ada catatan akhir.</p>
                )}
              </div>
            )}

            {/* ACTION */}

            {selectedTask.status === "Belum" && (
              <div className="task-detail-actions">
                <button
                  className="process-button"
                  onClick={() => startTask(selectedTask)}
                >
                  Mulai Kerjakan
                </button>
              </div>
            )}

            {selectedTask.status === "Proses" && (
              <div className="task-detail-actions">
                <button
                  className="upload-result-button"
                  onClick={() => {
                    const task = selectedTask;

                    closeDetail();
                    openResultUpload(task);
                  }}
                >
                  {selectedTask.resultFileName ? "Ganti Hasil" : "Upload Hasil"}
                </button>

                <button
                  className="complete-button"
                  onClick={() => {
                    const task = selectedTask;

                    closeDetail();
                    openFinishTask(task);
                  }}
                >
                  ✓ Selesaikan Tugas
                </button>
              </div>
            )}

            {selectedTask.status === "Selesai" && (
              <div className="completed-archive-info">
                ✓ Tugas selesai dan tersimpan di Riwayat Tugas.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskManager;
