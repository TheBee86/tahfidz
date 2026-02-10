/**
 * LOGIKA UTAMA APLIKASI (Full Version)
 * SD Teladan Yogyakarta
 */

const webAppUrl = "https://script.google.com/macros/s/AKfycbyI5TLyJrDAr_dxRF2qxFAFDZSPXWcLdc8I-BYYjbu4ZsMgR1_fdiAm0UQCKdSMZSybmQ/exec";
let activeGuru = "";
let selectedSiswa = {};

// 1. NAVIGASI HALAMAN
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    window.scrollTo(0, 0);
}

// 2. INISIALISASI SPINNER HALAMAN (1-44)
function initHalaman() {
    const spH = document.getElementById('spHalaman');
    if (!spH) return;
    for(let i=1; i<=44; i++) {
        let opt = document.createElement('option');
        opt.value = "Halaman " + i; 
        opt.innerText = "Halaman " + i;
        spH.appendChild(opt);
    }
}
document.addEventListener('DOMContentLoaded', initHalaman);

// 3. LOGIKA LOGIN GURU
function performLoginGuru() {
    const nama = document.getElementById('etNamaGuru').value.trim();
    const niy = document.getElementById('etNIY').value.trim();

    if (dbGuru[nama] && dbGuru[nama] === niy) {
        activeGuru = nama;
        document.getElementById('welcomeGuru').innerText = "Assalamu'alaikum, " + nama;
        renderMuridList();
        showPage('activity_daftar_murid');
    } else {
        alert("Nama Guru atau NIY salah!");
    }
}

// 4. LOGIKA DAFTAR MURID (Pengganti MuridAdapter.kt)
function renderMuridList() {
    const container = document.getElementById('rvMurid');
    container.innerHTML = "";
    
    // Urutkan Abjad
    const list = (dbMuridGuru[activeGuru] || []).sort((a, b) => a.n.localeCompare(b.n));

    list.forEach((m, idx) => {
        if (idx === 0 || m.t !== list[idx-1].t) {
            const header = document.createElement('div');
            header.className = "group-header";
            header.innerText = m.t || "Reguler";
            container.appendChild(header);
        }

        const item = document.createElement('div');
        item.className = "item-murid";
        item.innerHTML = `<div><b>${m.n}</b><br><small>${m.k}</small></div>`;
        item.onclick = () => openForm(m);
        container.appendChild(item);
    });
}

// 5. LOGIKA FORM INPUT (InputCapaianActivity.kt)
function openForm(m) {
    selectedSiswa = m;
    document.getElementById('targetNama').innerText = m.n;
    document.getElementById('targetKls').innerText = m.k;
    
    const isKhusus = m.t.includes("Khusus Tahfidz");
    
    // Tampilkan/Sembunyikan Layout (View.GONE)
    document.getElementById('layoutTilawati').style.display = isKhusus ? "none" : "block";
    document.getElementById('layoutAlquran').style.display = isKhusus ? "none" : "block";
    document.getElementById('layoutCatatan').style.display = isKhusus ? "none" : "block";
    
    // Reset Spinner & Input
    document.getElementById('spJilid').selectedIndex = 0;
    document.getElementById('spHalaman').selectedIndex = 0;
    document.getElementById('etAlquran').value = "";
    document.getElementById('etHafalan').value = "";
    
    // Ganti Opsi Predikat Hafalan
    const spHafalan = document.getElementById('spPredikatHafalan');
    if (isKhusus) {
        spHafalan.innerHTML = `<option>Pilih Nilai</option><option>A (Sangat Lancar)</option><option>B (Lancar)</option><option>C (Cukup Lancar)</option><option>D (Perlu Murojaah)</option>`;
    } else {
        spHafalan.innerHTML = `<option>Pilih Nilai</option><option>A (Sangat Baik)</option><option>B (Baik)</option><option>C (Cukup)</option>`;
    }
    
    showPage('activity_input');
}

// 6. LOGIKA AUTO CATATAN & CHAR COUNTER
function updateCharCounter() {
    const len = document.getElementById('etCatatan').value.length;
    const counter = document.getElementById('charCounter');
    counter.innerText = `${len}/360`;
    counter.style.color = len >= 350 ? "red" : "#555555";
}

function updateCatatanOtomatis() {
    if (selectedSiswa.t.includes("Khusus Tahfidz")) return;

    const pTila = document.getElementById('spPredikatTilawati').value;
    const pAlquran = document.getElementById('spPredikatAlquran').value;
    const pHafalan = document.getElementById('spPredikatHafalan').value;

    const getScore = (p) => p.includes("A") ? 3 : p.includes("B") ? 2 : p.includes("C") ? 1 : 0;

    const totalScore = getScore(pTila) + getScore(pAlquran) + getScore(pHafalan);
    const avg = totalScore / 3.0;

    let pred = avg >= 2.5 ? "sangat baik" : avg >= 1.5 ? "baik" : "cukup baik";

    document.getElementById('etCatatan').value = `Alhamdulillah, ananda mampu mengikuti pelajaran tahfidz dengan ${pred}. Mohon pendampingan Bapak dan ibu dirumah agar ananda istiqomah murojaah di rumah.`;
    updateCharCounter();
}

// 7. SIMPAN KE SPREADSHEET (POST)
function simpanData() {
    const btn = document.getElementById('btnSimpan');
    const isKhusus = selectedSiswa.t.includes("Khusus Tahfidz");
    
    btn.innerText = "Mengirim..."; btn.disabled = true;

    const params = new URLSearchParams();
    // Gunakan nama parameter yang ditangkap oleh script .gs di atas
    params.append("guru", activeGuru);
    params.append("nama_siswa", selectedSiswa.n);
    params.append("kls", selectedSiswa.k); 
    params.append("hafalan", document.getElementById('etHafalan').value);
    params.append("predikat_hafalan", document.getElementById('spPredikatHafalan').value);

    if (isKhusus) {
        ["jilid", "halaman", "predikat_tilawati", "alquran", "predikat_alquran", "catatan"].forEach(k => params.append(k, "-"));
    } else {
        params.append("jilid", document.getElementById('spJilid').value);
        params.append("halaman", document.getElementById('spHalaman').value);
        params.append("predikat_tilawati", document.getElementById('spPredikatTilawati').value);
        params.append("alquran", document.getElementById('etAlquran').value);
        params.append("predikat_alquran", document.getElementById('spPredikatAlquran').value);
        params.append("catatan", document.getElementById('etCatatan').value);
    }

    fetch(webAppUrl, { method: 'POST', mode: 'no-cors', body: params })
    .then(() => {
        alert("Data Berhasil Tersimpan!");
        btn.innerText = "SIMPAN DATA"; btn.disabled = false;
        showPage('activity_daftar_murid');
    }).catch(() => {
        alert("Terjadi Kesalahan."); btn.disabled = false;
    });
}

// 8. LOGIKA WALI MURID (Login & Cek Progres)
function performLoginWali() {
    const namaInput = document.getElementById('etNamaAnanda').value.toUpperCase().trim();
    const tglRaw = document.getElementById('etTglLahir').value;

    if (!namaInput || !tglRaw) { alert("Lengkapi data!"); return; }

    const dateParts = tglRaw.split("-");
    const bulanNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const tglFormatted = `${dateParts[2]} ${bulanNames[parseInt(dateParts[1])-1]} ${dateParts[0]}`;

    if (dbSiswa[namaInput] === tglFormatted) {
        document.getElementById('tvAnandaTitle').innerText = "Laporan Capaian " + namaInput;
        showPage('activity_hasil_wali');
        fetchProgres(namaInput);
    } else {
        alert("Data tidak ditemukan! Gunakan Nama Lengkap & Tgl Lahir yang benar.");
    }
}

function fetchProgres(nama) {
    const container = document.getElementById('listProgres');
    container.innerHTML = "Memuat data...";

    fetch(`${webAppUrl}?nama=${nama}`)
    .then(res => res.json())
    .then(data => {
        container.innerHTML = "";
        if (data.length === 0) { container.innerHTML = "Belum ada riwayat laporan."; return; }
        
        data.forEach(d => {
            const item = document.createElement('div');
            item.className = "item-murid";
            item.style.flexDirection = "column";
            item.style.alignItems = "flex-start";
            item.innerHTML = `
                <span style="color:var(--primary); font-weight:bold;">${d.tanggal}</span>
                <span style="font-size:14px;"><b>Hafalan:</b> ${d.hafalan}</span>
                <span style="font-size:14px;"><b>Nilai:</b> ${d.predikat}</span>
                <span style="font-size:12px; color:#777; margin-top:5px;">Oleh: ${d.guru}</span>
            `;
            container.appendChild(item);
        });
    });
}
