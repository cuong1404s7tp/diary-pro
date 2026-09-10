// ============================================
// DIARY PRO - APP LOGIC
// ============================================
console.log('✅ app.js loaded');

let diaryData = [];
let currentMode = 'ca_nhan';
let editingId = null;

// ============================================
// KHỞI TẠO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready');

    // Set ngày hôm nay
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Set filter mặc định
    const filterYear = document.getElementById('filter-year');
    if (filterYear) filterYear.value = new Date().getFullYear();
    const filterMonth = document.getElementById('filter-month');
    if (filterMonth) filterMonth.value = new Date().getMonth();

    // Load dữ liệu từ server
    fetchDataFromServer();
});

// ============================================
// CHUYỂN TAB CÁ NHÂN / CÔNG VIỆC
// ============================================
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('tab-active'));
    const tabId = 'tab-' + mode.replace('_', '-');
    const el = document.getElementById(tabId);
    if (el) el.classList.add('tab-active');
    renderUI();
}

// ============================================
// HIỂN THỊ FILTER
// ============================================
function toggleFilterUI() {
    const type = document.getElementById('filter-time').value;
    document.getElementById('date-range-inputs').classList.toggle('d-none', type !== 'range');
    document.getElementById('quick-month-year').classList.toggle('d-none', type !== 'month_quick');
    renderUI();
}

// ============================================
// LỌC THEO THỜI GIAN
// ============================================
function isDateInFilter(dateStr) {
    const type = document.getElementById('filter-time').value;
    if (type === 'all') return true;
    if (!dateStr) return false;

    const itemDate = new Date(dateStr);
    itemDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (type) {
        case 'today':
            return itemDate.getTime() === now.getTime();
        case 'week': {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const mon = new Date(new Date().setDate(diff));
            const sun = new Date(new Date(mon).setDate(mon.getDate() + 6));
            mon.setHours(0, 0, 0, 0);
            sun.setHours(23, 59, 59, 999);
            return itemDate >= mon && itemDate <= sun;
        }
        case 'month_quick': {
            const m = parseInt(document.getElementById('filter-month').value);
            const y = parseInt(document.getElementById('filter-year').value);
            return itemDate.getMonth() === m && itemDate.getFullYear() === y;
        }
        case 'year_current':
            return itemDate.getFullYear() === now.getFullYear();
        case 'range': {
            const s = new Date(document.getElementById('start-date').value);
            const e = new Date(document.getElementById('end-date').value);
            if (isNaN(s) || isNaN(e)) return true;
            s.setHours(0, 0, 0, 0);
            e.setHours(23, 59, 59, 999);
            return itemDate >= s && itemDate <= e;
        }
        default:
            return true;
    }
}

// ============================================
// RENDER DANH SÁCH NHẬT KÝ
// ============================================
function renderUI() {
    console.log('🎨 renderUI() called, diaryData.length =', diaryData.length);

    const listDiv = document.getElementById('data-list');
    if (!listDiv) {
        console.error('❌ Không tìm thấy #data-list');
        return;
    }

    const searchInput = (document.getElementById('search-input').value || '').toLowerCase().trim();
    listDiv.innerHTML = '';

    // Lọc dữ liệu
    const filtered = diaryData.filter(item => {
        const matchCat = item.category === currentMode;
        const matchTime = isDateInFilter(item.date);
        const content = (item.content || '').toLowerCase();
        const dateStr = (item.date || '').toLowerCase();
        const matchSearch = content.includes(searchInput) || dateStr.includes(searchInput);
        return matchCat && matchTime && matchSearch;
    });

    console.log('📊 Filtered:', filtered.length, 'items');

    // Hiển thị thông báo nếu rỗng
    if (filtered.length === 0) {
        listDiv.innerHTML = `
            <div style="text-align:center; color:#9ca3af; padding:40px;">
                <i class="fa fa-inbox" style="font-size:48px; opacity:0.3;"></i>
                <p style="margin-top:12px;">Chưa có nhật ký nào. Hãy nhập và nhấn "LƯU & ĐỒNG BỘ CLOUD".</p>
            </div>`;
        return;
    }

    // Render từng item
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'entry-card';

        let mediaHtml = '';
        const link = item.link || '';
        if (link) {
            if (link.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                mediaHtml = `<div class="media-container"><img src="${link}" alt="image"></div>`;
            } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
                const vId = extractYoutubeId(link);
                if (vId) {
                    mediaHtml = `<div class="mt-2"><iframe width="100%" height="250" src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen></iframe></div>`;
                }
            }
        }

        const stClass = item.status === 'hoan_thanh' ? 'status-done' : 'status-doing';
        const stText = item.status === 'hoan_thanh' ? 'Xong' : 'Đang làm';

        card.innerHTML = `
            <span class="badge-status ${stClass}">${stText}</span>
            <span class="entry-date"><i class="fa fa-calendar-alt me-1"></i> ${formatDate(item.date)}</span>
            <div class="entry-content">${escapeHtml(item.content)}</div>
            ${mediaHtml}
            <div class="mt-3">
                <button class="btn-light" onclick="editEntry('${item.id}')">Sửa</button>
                <button class="btn-light text-danger" onclick="deleteEntry('${item.id}')">Xóa</button>
            </div>
        `;
        listDiv.appendChild(card);
    });
}

// Escape HTML để tránh XSS
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// LƯU NHẬT KÝ
// ============================================
function handleSaveAction() {
    const content = document.getElementById('input-content').value.trim();
    if (!content) {
        alert('Vui lòng nhập nội dung!');
        return;
    }

    const entry = {
        id: editingId ? editingId.toString() : 'id_' + Date.now(),
        date: document.getElementById('input-date').value,
        content: content,
        link: document.getElementById('input-link').value.trim(),
        status: document.getElementById('input-status').value,
        category: currentMode
    };

    if (editingId) {
        const idx = diaryData.findIndex(i => i.id.toString() === editingId.toString());
        if (idx !== -1) diaryData[idx] = entry;
        editingId = null;
        document.getElementById('btn-save').innerHTML = '<i class="fa fa-cloud-upload-alt me-2"></i>LƯU & ĐỒNG BỘ CLOUD';
    } else {
        diaryData.unshift(entry);
    }

    localStorage.setItem('diary_pro_db', JSON.stringify(diaryData));
    renderUI();
    clearForm();
    syncUpload();
}

function clearForm() {
    document.getElementById('input-content').value = '';
    document.getElementById('input-link').value = '';
}

function editEntry(id) {
    const item = diaryData.find(i => i.id.toString() === id.toString());
    if (!item) return;
    editingId = id.toString();
    document.getElementById('input-date').value = item.date;
    document.getElementById('input-content').value = item.content;
    document.getElementById('input-link').value = item.link || '';
    document.getElementById('input-status').value = item.status;
    document.getElementById('btn-save').innerHTML = '<i class="fa fa-save me-2"></i>CẬP NHẬT THAY ĐỔI';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
    if (!confirm('Xác nhận xóa?')) return;
    diaryData = diaryData.filter(i => i.id.toString() !== id.toString());
    localStorage.setItem('diary_pro_db', JSON.stringify(diaryData));
    renderUI();
    syncUpload();
}

// ============================================
// ĐỒNG BỘ SERVER
// ============================================
async function syncUpload() {
    updateSyncStatus('⏳ Đang lưu...', '#f59e0b');
    try {
        const res = await fetch('/api/diaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(diaryData)
        });
        if (res.ok) {
            updateSyncStatus('✅ Đã lưu Cloud', '#10b981');
        } else {
            updateSyncStatus('❌ Lỗi Cloud', '#ef4444');
        }
    } catch (e) {
        console.error(e);
        updateSyncStatus('❌ Lỗi kết nối', '#ef4444');
    }
}

async function fetchDataFromServer() {
    updateSyncStatus('⏳ Tải dữ liệu...', '#3b82f6');

    // Load LocalStorage trước để hiển thị ngay
    const local = localStorage.getItem('diary_pro_db');
    if (local) {
        try {
            diaryData = JSON.parse(local);
            console.log('📦 Loaded from localStorage:', diaryData.length);
            renderUI();
        } catch (e) { console.error('Lỗi parse localStorage:', e); }
    } else {
        renderUI();
    }

    // Thử lấy từ server
    try {
        const res = await fetch('/api/diaries');
        if (res.ok) {
            const serverData = await res.json();
            if (Array.isArray(serverData) && serverData.length > 0) {
                console.log('☁️ Loaded from server:', serverData.length);
                diaryData = serverData.map(i => ({ ...i, id: i.id.toString() }));
                localStorage.setItem('diary_pro_db', JSON.stringify(diaryData));
                renderUI();
            }
            updateSyncStatus('✅ Cloud Updated', '#10b981');
        } else {
            updateSyncStatus('✅ Local only', '#10b981');
        }
    } catch (e) {
        console.error('Lỗi fetch server:', e);
        updateSyncStatus('✅ Local only', '#10b981');
    }
}

function updateSyncStatus(text, color) {
    const el = document.getElementById('sync-status');
    if (el) {
        el.innerText = text;
        el.style.color = color;
    }
}

// ============================================
// FILTER RESET
// ============================================
function resetFilter() {
    document.getElementById('filter-time').value = 'all';
    document.getElementById('search-input').value = '';
    document.getElementById('filter-year').value = new Date().getFullYear();
    document.getElementById('filter-month').value = new Date().getMonth();
    toggleFilterUI();
}

// ============================================
// UTILS
// ============================================
function formatDate(s) {
    if (!s) return 'N/A';
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
}

function extractYoutubeId(u) {
    const m = u.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
}

// ============================================
// EXPORT / IMPORT JSON
// ============================================
function exportToJSON() {
    const blob = new Blob([JSON.stringify(diaryData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `diary_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
}

function importFromJSON(input) {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Invalid format');
            diaryData = imported;
            localStorage.setItem('diary_pro_db', JSON.stringify(diaryData));
            renderUI();
            syncUpload();
            alert('Nhập dữ liệu thành công!');
        } catch (err) {
            alert('File không đúng định dạng!');
        }
    };
    r.readAsText(f);
}

function clearAllData() {
    if (confirm('Xóa sạch dữ liệu trên máy này?')) {
        diaryData = [];
        localStorage.setItem('diary_pro_db', JSON.stringify(diaryData));
        renderUI();
        syncUpload();
    }
}

async function backupToServer() {
    if (!confirm('Sao lưu lên Cloud?')) return;
    await syncUpload();
    alert('Đã sao lưu lên Cloud!');
}