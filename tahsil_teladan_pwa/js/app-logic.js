/**
 * LOGIKA UTAMA APLIKASI (Konversi dari Kotlin)
 * SD Teladan Yogyakarta
 */

let activeGuru = "";
let selectedSiswa = {};

// 1. Fungsi Navigasi (Halaman)
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    window.scrollTo(0, 0);
}

// 2. Logika Login Guru (NIY Validation)
function performLoginGuru() {
    const nama = document.getElementById('etNamaGuru').value.trim();
    const niy = document.getElementById('etNIY').value.trim();

    if (dbGuru[nama] && dbGuru[nama] === niy) {
        activeGuru = nama;
        document.getElementById('welcomeGuru').innerText = "Assalamu'alaikum, " + nama;
        renderMuridList();
        showPage('activity_daftar_murid');
    } else {
        alert("Nama Guru atau NIY salah. Pastikan nama panggilan sesuai (Contoh: Pak Tebe)");
    }
}

// 3. Logika Login Wali (Tanggal Lahir Converter)
function performLoginWali() {
    const namaInput = document.getElementById('etNamaAnanda').value.toUpperCase().trim();
    const tglRaw = document.getElementById('etTglLahir').value; // Format: YYYY-MM-DD

    if (!namaInput || !tglRaw) {
        alert("Mohon lengkapi Nama dan Tanggal Lahir");
        return;
    }

    // Konversi YYYY-MM-DD ke "DD BULAN YYYY" agar cocok dengan database-siswa.js
    const dateParts = tglRaw.split("-");
    const day = dateParts[2];
    const monthIndex = parseInt(dateParts[1]) - 1;
    const year = dateParts[0];
    
    const bulanNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", 
                        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    
    const tglFormatted = `${day} ${bulanNames[monthIndex]} ${year}`;

    if (dbSiswa[namaInput] === tglFormatted) {
        document.getElementById('tvAnandaTitle').innerText = "Laporan Capaian " + namaInput;
        showPage('activity_hasil_wali');
        fetchProgresSiswa(namaInput);
    } else {
        alert("Data tidak ditemukan. Periksa Nama Lengkap (KAPITAL) dan Tanggal Lahir.");
    }
}

// 4. Render Daftar Murid (RecyclerView Logic)
function renderMuridList() {
    const container = document.getElementById('rvMurid');
    container.innerHTML = "";
    const list = dbMuridGuru[activeGuru] || [];

    list.forEach((m, idx) => {
        // Logika Header (Tipe Kelompok)
        if (idx === 0 || m.t !== list[idx-1].t) {
            const header = document.createElement('div');
            header.className = "group-header";
            header.innerText = m.t || "Reguler";
            container.appendChild(header);
        }

        const item = document.createElement('div');
        item.className = "item-murid";
        item.innerHTML = `<div><b>${m.n}</b><br><small>${m.k}</small></div>`;
        item.onclick = () => openInputForm(m);
        container.appendChild(item);
    });
}

// 5. Form Input & Auto-Generate Note
function openInputForm(m) {
    selectedSiswa = m;
    document.getElementById('targetNama').innerText = m.n;
    document.getElementById('targetKls').innerText = m.k;
    
    // Reset form
    document.getElementById('etHafalan').value = "";
    document.getElementById('etCatatan').value = "";
    
    const isKhusus = m.t && m.t.includes("Khusus");
    document.getElementById('layoutReguler').className = isKhusus ? "hidden" : "";
    
    // Sesuaikan Predikat Hafalan
    const spHafalan = document.getElementById('spPredikatHafalan');
    spHafalan.innerHTML = isKhusus 
        ? '<option value="">Pilih Predikat</option><option>A (Sangat Lancar)</option><option>B (Lancar)</option><option>C (Cukup Lancar)</option><option>D (Perlu Murojaah)</option>'
        : '<option value="">Pilih Predikat</option><option>A (Sangat Baik)</option><option>B (Baik)</option><option>C (Cukup)</option>';
        
    showPage('activity_input');
}

function autoGenerateNote() {
    if (selectedSiswa.t && selectedSiswa.t.includes("Khusus")) return;

    const pTila = document.getElementById('spPredikatReguler').value;
    const pHafal = document.getElementById('spPredikatHafalan').value;

    const score = (p) => p.includes("A") ? 3 : p.includes("B") ? 2 : p.includes("C") ? 1 : 0;
    const avg = (score(pTila) + score(pHafal)) / 2;
    
    let predStr = avg >= 2.5 ? "sangat baik" : avg >= 1.5 ? "baik" : "cukup baik";
    
    document.getElementById('etCatatan').value = `Alhamdulillah, ananda mampu mengikuti pelajaran tahfidz dengan ${predStr}. Mohon pendampingan Bapak dan Ibu di rumah agar ananda istiqomah murojaah.`;
    updateCharCounter();
}

function updateCharCounter() {
    const len = document.getElementById('etCatatan').value.length;
    const counter = document.getElementById('charCounter');
    counter.innerText = `${len}/360`;
    counter.style.color = len >= 350 ? "red" : "#888";
}

// 6. Simpan Data ke Google Sheets
function simpanData() {
    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const payload = new URLSearchParams({
        guru: activeGuru,
        nama_siswa: selectedSiswa.n,
        kls: selectedSiswa.k,
        hafalan: document.getElementById('etHafalan').value,
        predikat_hafalan: document.getElementById('spPredikatHafalan').value,
        catatan: document.getElementById('etCatatan').value || "-"
    });

    fetch(webAppUrl, { method: 'POST', mode: 'no-cors', body: payload })
    .then(() => {
        alert("Data berhasil disimpan ke database!");
        btn.innerText = "SIMPAN";
        btn.disabled = false;
        showPage('activity_daftar_murid');
    })
    .catch(err => {
        alert("Gagal menyimpan data.");
        btn.disabled = false;
    });
}
