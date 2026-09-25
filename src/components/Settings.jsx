import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Settings({ activeSemester, changeSemester }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [hasProfile, setHasProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const [email, setEmail] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    nickname: "",
    university: "",
    studyProgram: "",
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // AMBIL PROFIL
  // =========================

  useEffect(() => {
    // Ambil profil saat Header pertama kali dibuka
    fetchProfile();

    // Dengarkan perubahan profil dari Settings
    function handleProfileUpdated() {
      fetchProfile();
    }

    window.addEventListener("campusflow-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener(
        "campusflow-profile-updated",
        handleProfileUpdated,
      );
    };
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Akun tidak ditemukan.");
        return;
      }

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, nickname, university, study_program")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Gagal mengambil profil:", error);
        setMessage("Profil belum bisa dimuat.");
        return;
      }

      if (data) {
        const loadedProfile = {
          fullName: data.full_name || "",
          nickname: data.nickname || "",
          university: data.university || "",
          studyProgram: data.study_program || "",
        };

        setProfile(loadedProfile);

        const profileAlreadyFilled = Boolean(
          loadedProfile.fullName.trim() ||
          loadedProfile.nickname.trim() ||
          loadedProfile.university.trim() ||
          loadedProfile.studyProgram.trim(),
        );

        setHasProfile(profileAlreadyFilled);

        // Saat membuka Settings:
        // profil sudah ada -> hanya tampilkan data
        // profil belum ada -> tampilkan tombol Tambah Profil
        setShowProfileForm(false);
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error("Error mengambil profil:", error);
      setMessage("Terjadi masalah saat memuat profil.");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // INPUT PROFIL
  // =========================

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // =========================
  // BUKA FORM TAMBAH PROFIL
  // =========================

  function handleAddProfile() {
    setMessage("");
    setIsEditingProfile(false);
    setShowProfileForm(true);
  }

  // =========================
  // BUKA FORM UBAH PROFIL
  // =========================

  function handleEditProfile() {
    setMessage("");
    setIsEditingProfile(true);
    setShowProfileForm(true);
  }

  // =========================
  // BATAL EDIT / TAMBAH
  // =========================

  async function handleCancelProfile() {
    setMessage("");
    setShowProfileForm(false);
    setIsEditingProfile(false);

    // Kalau membatalkan perubahan pada profil lama,
    // ambil ulang data asli dari Supabase.
    if (hasProfile) {
      await fetchProfile();
    } else {
      setProfile({
        fullName: "",
        nickname: "",
        university: "",
        studyProgram: "",
      });
    }
  }

  // =========================
  // SIMPAN PROFIL
  // =========================

  async function saveProfile(event) {
    event.preventDefault();

    const cleanFullName = profile.fullName.trim();
    const cleanNickname = profile.nickname.trim();
    const cleanUniversity = profile.university.trim();
    const cleanStudyProgram = profile.studyProgram.trim();

    if (
      !cleanFullName ||
      !cleanNickname ||
      !cleanUniversity ||
      !cleanStudyProgram
    ) {
      setMessage("Lengkapi semua informasi profil terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Akun tidak ditemukan.");
        return;
      }

      const wasExistingProfile = hasProfile;

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: cleanFullName,
          nickname: cleanNickname,
          university: cleanUniversity,
          study_program: cleanStudyProgram,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (error) {
        console.error("Gagal menyimpan profil:", error);
        setMessage("Profil gagal disimpan. Silakan coba lagi.");
        return;
      }

      setProfile({
        fullName: cleanFullName,
        nickname: cleanNickname,
        university: cleanUniversity,
        studyProgram: cleanStudyProgram,
      });

      setHasProfile(true);
      setShowProfileForm(false);
      setIsEditingProfile(false);

      setMessage(
        wasExistingProfile
          ? "Profil berhasil diperbarui."
          : "Profil berhasil disimpan.",
      );

      // Beri tahu Header supaya mengambil profil terbaru
      window.dispatchEvent(new Event("campusflow-profile-updated"));

      // Setelah simpan, otomatis kembali ke atas
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error menyimpan profil:", error);
      setMessage("Terjadi masalah saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // GANTI PASSWORD
  // =========================

  async function changePassword(event) {
    event.preventDefault();

    setMessage("");

    if (!password) {
      setMessage("Masukkan password baru terlebih dahulu.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Gagal mengganti password:", error);
        setMessage("Password gagal diperbarui.");
        return;
      }

      setPassword("");
      setConfirmPassword("");

      setMessage("Password berhasil diperbarui.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error mengganti password:", error);
      setMessage("Terjadi masalah saat mengganti password.");
    }
  }

  // =========================
  // AVATAR INISIAL
  // =========================

  const initial = profile.fullName.trim()
    ? profile.fullName.trim().charAt(0).toUpperCase()
    : "M";

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="settings-loading-icon">⚙</div>

          <h3>Menyiapkan pengaturan...</h3>

          <p>Sebentar ya, profil kamu sedang dimuat.</p>
        </div>
      </div>
    );
  }

  // =========================
  // RETURN
  // =========================

  return (
    <div className="settings-page">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <span className="settings-eyebrow">ACCOUNT & PREFERENCES</span>

          <h2>Settings</h2>

          <p>Atur profil, semester aktif, dan keamanan akun CampusFlow.</p>
        </div>
      </div>

      {/* MESSAGE */}

      {message && <div className="settings-message">{message}</div>}

      {/* PROFILE HERO */}

      <div className="settings-profile-hero">
        <div className="settings-avatar">{initial}</div>

        <div className="settings-profile-identity">
          <span>PROFIL MAHASISWA</span>

          <h2>{hasProfile ? profile.fullName : "Profil belum ditambahkan"}</h2>

          <p>{email}</p>
        </div>

        <div className="settings-semester-badge">Semester {activeSemester}</div>
      </div>

      <div className="settings-grid">
        {/* =========================
            PROFIL
        ========================= */}

        <section className="settings-card settings-profile-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">👤</div>

            <div>
              <span>PERSONAL INFORMATION</span>

              <h3>Profil Saya</h3>

              <p>Informasi yang digunakan untuk mempersonalisasi CampusFlow.</p>
            </div>
          </div>

          {/* =========================
              BELUM PUNYA PROFIL
          ========================= */}

          {!hasProfile && !showProfileForm && (
            <div className="settings-profile-empty">
              <div>
                <strong>Belum ada profil mahasiswa.</strong>

                <p>
                  Tambahkan informasi profil agar CampusFlow dapat menampilkan
                  identitas dan sapaan kamu.
                </p>
              </div>

              <button
                type="button"
                className="settings-primary-button"
                onClick={handleAddProfile}
              >
                + Tambah Profil
              </button>
            </div>
          )}

          {/* =========================
              PROFIL SUDAH TERSIMPAN
          ========================= */}

          {hasProfile && !showProfileForm && (
            <div className="settings-profile-saved">
              <div className="settings-profile-saved-info">
                <div className="settings-profile-detail">
                  <span>Nama Lengkap</span>
                  <strong>{profile.fullName}</strong>
                </div>

                <div className="settings-profile-detail">
                  <span>Nama Panggilan</span>
                  <strong>{profile.nickname || "-"}</strong>
                </div>

                <div className="settings-profile-detail">
                  <span>Email</span>
                  <strong>{email}</strong>
                </div>

                <div className="settings-profile-detail">
                  <span>Nama Kampus</span>
                  <strong>{profile.university || "-"}</strong>
                </div>

                <div className="settings-profile-detail">
                  <span>Program Studi</span>
                  <strong>{profile.studyProgram || "-"}</strong>
                </div>
              </div>

              <div className="settings-save-area">
                <div>
                  <strong>Profil kamu sudah tersimpan.</strong>

                  <span>
                    Informasi profil tidak dapat diubah sebelum memilih Ubah
                    Profil.
                  </span>
                </div>

                <button
                  type="button"
                  className="settings-primary-button"
                  onClick={handleEditProfile}
                >
                  ✏️ Ubah Profil
                </button>
              </div>
            </div>
          )}

          {/* =========================
              FORM TAMBAH / UBAH PROFIL
          ========================= */}

          {showProfileForm && (
            <form onSubmit={saveProfile} className="settings-form">
              <div className="settings-form-group">
                <label>Nama Lengkap</label>

                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleProfileChange}
                  placeholder="Contoh: Muhammad Dzaky Ghaly Ramdhani"
                  maxLength={100}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label>Nama Panggilan</label>

                <input
                  type="text"
                  name="nickname"
                  value={profile.nickname}
                  onChange={handleProfileChange}
                  placeholder="Contoh: Dzaky"
                  maxLength={30}
                  required
                />

                <small>
                  Nama ini akan digunakan untuk sapaan di CampusFlow.
                </small>
              </div>

              <div className="settings-form-group">
                <label>Email</label>

                <input type="email" value={email} disabled />

                <small>
                  Email terhubung dengan akun CampusFlow dan tidak diubah dari
                  halaman ini.
                </small>
              </div>

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label>Nama Kampus</label>

                  <input
                    type="text"
                    name="university"
                    value={profile.university}
                    onChange={handleProfileChange}
                    placeholder="Nama universitas / kampus"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label>Program Studi</label>

                  <input
                    type="text"
                    name="studyProgram"
                    value={profile.studyProgram}
                    onChange={handleProfileChange}
                    placeholder="Contoh: Informatika"
                    maxLength={120}
                    required
                  />
                </div>
              </div>

              <div className="settings-save-area">
                <div>
                  <strong>
                    {hasProfile
                      ? "Perbarui informasi profil kamu."
                      : "Pastikan profil kamu sudah benar."}
                  </strong>

                  <span>
                    {hasProfile
                      ? "Simpan perubahan setelah informasi diperbarui."
                      : "Periksa kembali informasi sebelum menyimpan profil."}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="settings-password-button"
                    onClick={handleCancelProfile}
                    disabled={saving}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="settings-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Menyimpan..."
                      : hasProfile
                        ? "Simpan Perubahan"
                        : "Simpan Profil"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>

        {/* =========================
            AKADEMIK
        ========================= */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🎓</div>

            <div>
              <span>ACADEMIC</span>

              <h3>Semester Aktif</h3>

              <p>
                Data CampusFlow akan menyesuaikan semester yang sedang kamu
                gunakan.
              </p>
            </div>
          </div>

          <div className="settings-semester-section">
            <label>Semester saat ini</label>

            <select
              value={activeSemester}
              onChange={(event) => changeSemester(event.target.value)}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>

            <div className="settings-info-box">
              <span>💡</span>

              <p>
                Mengganti semester tidak menghapus data semester sebelumnya.
                Kamu bisa kembali ke semester lama kapan saja.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            SECURITY
        ========================= */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🔐</div>

            <div>
              <span>SECURITY</span>

              <h3>Keamanan Akun</h3>

              <p>Perbarui password untuk menjaga keamanan akun kamu.</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="settings-form">
            <div className="settings-form-group">
              <label>Password Baru</label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
            </div>

            <div className="settings-form-group">
              <label>Konfirmasi Password</label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Masukkan kembali password baru"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="settings-password-button">
              Perbarui Password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
