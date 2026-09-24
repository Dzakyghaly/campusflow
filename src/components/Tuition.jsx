import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Tuition({ activeSemester }) {
  // =========================
  // DATA PEMBAYARAN
  // =========================

  const [tuition, setTuition] = useState({
    semester: Number(activeSemester),
    totalFee: 0,
    payments: [],
  });

  const [loading, setLoading] = useState(true);

  // =========================
  // MODAL
  // =========================

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSettingForm, setShowSettingForm] = useState(false);

  // =========================
  // FORM PEMBAYARAN
  // =========================

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: "",
    note: "",
  });

  // =========================
  // FORM PENGATURAN
  // =========================

  const [settingForm, setSettingForm] = useState({
    totalFee: 0,
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
  // AMBIL DATA TUITION
  // =========================

  async function fetchTuition() {
    try {
      setLoading(true);

      const user = await getCurrentUser();

      if (!user) {
        setTuition({
          semester: Number(activeSemester),
          totalFee: 0,
          payments: [],
        });

        return;
      }

      // =========================
      // AMBIL TOTAL TAGIHAN
      // =========================

      const { data: tuitionData, error: tuitionError } = await supabase
        .from("tuition")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .maybeSingle();

      if (tuitionError) {
        console.error("Gagal mengambil data tuition:", tuitionError);
      }

      // =========================
      // AMBIL RIWAYAT PEMBAYARAN
      // =========================

      const { data: paymentData, error: paymentError } = await supabase
        .from("tuition_payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .order("payment_date", { ascending: true });

      if (paymentError) {
        console.error("Gagal mengambil riwayat pembayaran:", paymentError);
      }

      const formattedPayments = (paymentData || []).map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.payment_date,
        note: payment.note || "",
      }));

      setTuition({
        semester: Number(activeSemester),
        totalFee: Number(tuitionData?.total_fee || 0),
        payments: formattedPayments,
      });

      setSettingForm({
        totalFee: Number(tuitionData?.total_fee || 0),
      });
    } catch (error) {
      console.error("Error mengambil Tuition:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    setShowPaymentForm(false);
    setShowSettingForm(false);

    fetchTuition();
  }, [activeSemester]);

  // =========================
  // PERHITUNGAN
  // =========================

  const totalPaid = tuition.payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const remaining = Math.max(Number(tuition.totalFee) - totalPaid, 0);

  const progress =
    tuition.totalFee === 0
      ? 0
      : Math.min(Math.round((totalPaid / tuition.totalFee) * 100), 100);

  // =========================
  // FORMAT RUPIAH
  // =========================

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  // =========================
  // FORMAT TANGGAL
  // =========================

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =========================
  // INPUT PEMBAYARAN
  // =========================

  function handlePaymentChange(event) {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================
  // BUKA PEMBAYARAN
  // =========================

  function openPaymentForm() {
    if (tuition.totalFee <= 0) {
      alert("Atur total biaya semester terlebih dahulu.");
      return;
    }

    if (remaining <= 0) {
      alert("Pembayaran semester ini sudah lunas.");
      return;
    }

    setPaymentForm({
      amount: "",
      date: "",
      note: "",
    });

    setShowPaymentForm(true);
  }

  // =========================
  // TAMBAH PEMBAYARAN
  // =========================

  async function addPayment(event) {
    event.preventDefault();

    const amount = Number(paymentForm.amount);

    if (!amount || amount <= 0 || !paymentForm.date) {
      alert("Isi nominal dan tanggal pembayaran.");
      return;
    }

    if (amount > remaining) {
      alert("Nominal pembayaran melebihi sisa tagihan.");
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const defaultNote = `Pembayaran ${tuition.payments.length + 1}`;

      const { error } = await supabase.from("tuition_payments").insert([
        {
          user_id: user.id,
          semester: Number(activeSemester),
          payment_date: paymentForm.date,
          amount,
          note: paymentForm.note.trim() || defaultNote,
        },
      ]);

      if (error) {
        console.error("Gagal menambah pembayaran:", error);

        alert("Gagal menyimpan pembayaran: " + error.message);
        return;
      }

      setPaymentForm({
        amount: "",
        date: "",
        note: "",
      });

      setShowPaymentForm(false);

      await fetchTuition();
    } catch (error) {
      console.error("Error tambah pembayaran:", error);

      alert("Terjadi kesalahan saat menyimpan pembayaran.");
    }
  }

  // =========================
  // HAPUS PEMBAYARAN
  // =========================

  async function deletePayment(id) {
    const confirmDelete = window.confirm("Hapus catatan pembayaran ini?");

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
        .from("tuition_payments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Gagal menghapus pembayaran:", error);

        alert("Gagal menghapus pembayaran: " + error.message);
        return;
      }

      await fetchTuition();
    } catch (error) {
      console.error("Error hapus pembayaran:", error);

      alert("Terjadi kesalahan saat menghapus pembayaran.");
    }
  }

  // =========================
  // BUKA PENGATURAN
  // =========================

  function openSettingForm() {
    setSettingForm({
      totalFee: tuition.totalFee,
    });

    setShowSettingForm(true);
  }

  // =========================
  // SIMPAN PENGATURAN
  // =========================

  async function saveSetting(event) {
    event.preventDefault();

    const newTotalFee = Number(settingForm.totalFee);

    if (!newTotalFee || newTotalFee <= 0) {
      alert("Total biaya kuliah harus lebih dari 0.");
      return;
    }

    if (newTotalFee < totalPaid) {
      alert(
        "Total biaya tidak boleh lebih kecil dari jumlah yang sudah dibayar.",
      );

      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        alert("Sesi login tidak ditemukan.");
        return;
      }

      // Cek apakah semester ini sudah punya data tuition
      const { data: existingTuition, error: checkError } = await supabase
        .from("tuition")
        .select("id")
        .eq("user_id", user.id)
        .eq("semester", Number(activeSemester))
        .maybeSingle();

      if (checkError) {
        console.error("Gagal mengecek tuition:", checkError);

        alert("Gagal mengecek data biaya kuliah.");
        return;
      }

      // =========================
      // UPDATE
      // =========================

      if (existingTuition) {
        const { error } = await supabase
          .from("tuition")
          .update({
            total_fee: newTotalFee,
          })
          .eq("id", existingTuition.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Gagal update tuition:", error);

          alert("Gagal menyimpan total biaya: " + error.message);
          return;
        }
      }

      // =========================
      // INSERT
      // =========================
      else {
        const { error } = await supabase.from("tuition").insert([
          {
            user_id: user.id,
            semester: Number(activeSemester),
            total_fee: newTotalFee,
          },
        ]);

        if (error) {
          console.error("Gagal membuat tuition:", error);

          alert("Gagal menyimpan total biaya: " + error.message);
          return;
        }
      }

      setShowSettingForm(false);

      await fetchTuition();
    } catch (error) {
      console.error("Error simpan tuition:", error);

      alert("Terjadi kesalahan saat menyimpan total biaya.");
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="tuition-page">
        <div className="page-header">
          <div>
            <span className="section-label">SEMESTER {activeSemester}</span>

            <h2>Pembayaran Kuliah</h2>

            <p>Memuat data pembayaran...</p>
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // RETURN
  // =========================

  return (
    <section className="tuition-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="section-label">SEMESTER {activeSemester}</span>

          <h2>Pembayaran Kuliah</h2>

          <p>Pantau biaya dan pembayaran Semester {activeSemester}.</p>
        </div>

        <div className="tuition-header-actions">
          <button className="tuition-setting-button" onClick={openSettingForm}>
            Pengaturan
          </button>

          <button
            className="primary-task-button"
            onClick={openPaymentForm}
            disabled={remaining === 0 && tuition.totalFee > 0}
          >
            + Catat Pembayaran
          </button>
        </div>
      </div>

      {/* HERO */}

      <div className="tuition-hero">
        <div className="tuition-hero-top">
          <div>
            <span>SEMESTER</span>

            <h2>Semester {activeSemester}</h2>
          </div>

          <div
            className={
              tuition.totalFee > 0 && remaining === 0
                ? "payment-status paid"
                : "payment-status"
            }
          >
            {tuition.totalFee === 0
              ? "BELUM DIATUR"
              : remaining === 0
                ? "LUNAS"
                : "BELUM LUNAS"}
          </div>
        </div>

        <div className="tuition-main-value">
          <span>Total Biaya Semester</span>

          <h1>{formatRupiah(tuition.totalFee)}</h1>
        </div>

        <div className="tuition-big-progress">
          <div
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>

        <div className="tuition-progress-info">
          <span>Progress Pembayaran</span>

          <strong>{progress}%</strong>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="tuition-stat-grid">
        <div className="tuition-stat">
          <span>TOTAL TAGIHAN</span>

          <strong>{formatRupiah(tuition.totalFee)}</strong>

          <p>Semester {activeSemester}</p>
        </div>

        <div className="tuition-stat">
          <span>SUDAH DIBAYAR</span>

          <strong className="paid-value">{formatRupiah(totalPaid)}</strong>

          <p>{tuition.payments.length} transaksi</p>
        </div>

        <div className="tuition-stat">
          <span>SISA PEMBAYARAN</span>

          <strong
            className={
              tuition.totalFee > 0 && remaining === 0
                ? "paid-value"
                : "remaining-value"
            }
          >
            {formatRupiah(remaining)}
          </strong>

          <p>
            {tuition.totalFee === 0
              ? "Biaya belum diatur"
              : remaining === 0
                ? "Pembayaran selesai"
                : "Belum dibayar"}
          </p>
        </div>
      </div>

      {/* PAYMENT HISTORY */}

      <div className="payment-history-card">
        <div className="payment-history-header">
          <div>
            <span className="section-label">HISTORY</span>

            <h3>Riwayat Pembayaran</h3>
          </div>

          <span>{tuition.payments.length} pembayaran</span>
        </div>

        {tuition.payments.length === 0 ? (
          <div className="payment-empty">
            <div>Rp</div>

            <h3>Belum ada pembayaran</h3>

            <p>
              {tuition.totalFee === 0
                ? `Atur biaya Semester ${activeSemester} terlebih dahulu.`
                : "Catat pembayaran pertamamu."}
            </p>
          </div>
        ) : (
          <div className="payment-list">
            {[...tuition.payments]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((payment, index) => (
                <div className="payment-item" key={payment.id}>
                  <div className="payment-icon">✓</div>

                  <div className="payment-info">
                    <strong>{payment.note}</strong>

                    <span>{formatDate(payment.date)}</span>
                  </div>

                  <div className="payment-amount">
                    <strong>{formatRupiah(payment.amount)}</strong>

                    <span>
                      Pembayaran ke-
                      {tuition.payments.length - index}
                    </span>
                  </div>

                  <button
                    className="payment-delete"
                    onClick={() => deletePayment(payment.id)}
                  >
                    Hapus
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}

      {showPaymentForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">SEMESTER {activeSemester}</span>

                <h2>Catat Pembayaran</h2>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={() => setShowPaymentForm(false)}
              >
                ×
              </button>
            </div>

            <div className="remaining-payment-info">
              <span>Sisa pembayaran</span>

              <strong>{formatRupiah(remaining)}</strong>
            </div>

            <form onSubmit={addPayment}>
              <div className="form-group">
                <label>Nominal Pembayaran</label>

                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentChange}
                  placeholder="Contoh: 1000000"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Tanggal Pembayaran</label>

                <input
                  type="date"
                  name="date"
                  value={paymentForm.date}
                  onChange={handlePaymentChange}
                />
              </div>

              <div className="form-group">
                <label>Keterangan</label>

                <input
                  type="text"
                  name="note"
                  value={paymentForm.note}
                  onChange={handlePaymentChange}
                  placeholder="Contoh: Cicilan 1"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Batal
                </button>

                <button type="submit" className="save-button">
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTING MODAL */}

      {showSettingForm && (
        <div className="modal-overlay">
          <div className="task-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">TUITION SETTING</span>

                <h2>Pengaturan Semester {activeSemester}</h2>
              </div>

              <button
                type="button"
                className="close-modal"
                onClick={() => setShowSettingForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveSetting}>
              <div className="form-group">
                <label>Semester Aktif</label>

                <input
                  type="text"
                  value={`Semester ${activeSemester}`}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Total Biaya Semester</label>

                <input
                  type="number"
                  value={settingForm.totalFee}
                  onChange={(event) =>
                    setSettingForm({
                      ...settingForm,
                      totalFee: event.target.value,
                    })
                  }
                  placeholder="Contoh: 3000000"
                  min="1"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowSettingForm(false)}
                >
                  Batal
                </button>

                <button type="submit" className="save-button">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Tuition;
