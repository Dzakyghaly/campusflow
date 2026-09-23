import { useEffect, useState } from "react";

function Tuition({ activeSemester }) {
  // =========================
  // STORAGE PER SEMESTER
  // =========================

  function getStorageKey(semester) {
    return `campusflow-tuition-semester-${semester}`;
  }

  function getTuitionBySemester(semester) {
    const semesterKey = getStorageKey(semester);

    const savedSemester = localStorage.getItem(semesterKey);

    // Kalau semester sudah punya data
    if (savedSemester !== null) {
      return JSON.parse(savedSemester);
    }

    // Migrasi data lama ke Semester 1
    if (semester === "1") {
      const oldTuition = localStorage.getItem("campusflow-tuition");

      if (oldTuition !== null) {
        const parsedOldTuition = JSON.parse(oldTuition);

        const migratedTuition = {
          ...parsedOldTuition,
          semester: 1,
        };

        localStorage.setItem(semesterKey, JSON.stringify(migratedTuition));

        return migratedTuition;
      }
    }

    // Semester baru dimulai kosong
    return {
      semester: Number(semester),
      totalFee: 0,
      payments: [],
    };
  }

  // =========================
  // DATA PEMBAYARAN
  // =========================

  const [tuition, setTuition] = useState(() =>
    getTuitionBySemester(activeSemester),
  );

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
    totalFee: tuition.totalFee,
  });

  // =========================
  // SIMPAN LOCAL STORAGE
  // =========================

  useEffect(() => {
    const semesterKey = getStorageKey(activeSemester);

    localStorage.setItem(semesterKey, JSON.stringify(tuition));
  }, [tuition, activeSemester]);

  // =========================
  // PERHITUNGAN
  // =========================

  const totalPaid = tuition.payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const remaining = Math.max(tuition.totalFee - totalPaid, 0);

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
    }).format(value);
  }

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
  // INPUT PEMBAYARAN
  // =========================

  function handlePaymentChange(event) {
    const { name, value } = event.target;

    setPaymentForm({
      ...paymentForm,
      [name]: value,
    });
  }

  // =========================
  // BUKA PEMBAYARAN
  // =========================

  function openPaymentForm() {
    if (tuition.totalFee <= 0) {
      alert("Atur total biaya semester terlebih dahulu.");

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

  function addPayment(event) {
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

    const newPayment = {
      id: Date.now(),
      amount,
      date: paymentForm.date,
      note: paymentForm.note || `Pembayaran ${tuition.payments.length + 1}`,
    };

    setTuition({
      ...tuition,

      payments: [...tuition.payments, newPayment],
    });

    setPaymentForm({
      amount: "",
      date: "",
      note: "",
    });

    setShowPaymentForm(false);
  }

  // =========================
  // HAPUS PEMBAYARAN
  // =========================

  function deletePayment(id) {
    const confirmDelete = window.confirm("Hapus catatan pembayaran ini?");

    if (!confirmDelete) {
      return;
    }

    setTuition({
      ...tuition,

      payments: tuition.payments.filter((payment) => payment.id !== id),
    });
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

  function saveSetting(event) {
    event.preventDefault();

    const newTotalFee = Number(settingForm.totalFee);

    if (newTotalFee <= 0) {
      alert("Total biaya kuliah harus lebih dari 0.");

      return;
    }

    if (newTotalFee < totalPaid) {
      alert(
        "Total biaya tidak boleh lebih kecil dari jumlah yang sudah dibayar.",
      );

      return;
    }

    setTuition({
      ...tuition,

      semester: Number(activeSemester),

      totalFee: newTotalFee,
    });

    setShowSettingForm(false);
  }

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
