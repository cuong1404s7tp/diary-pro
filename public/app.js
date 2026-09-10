document.addEventListener('DOMContentLoaded', () => {
    const btnSaveSync = document.getElementById('btnSaveSync');
    const btnSync = document.getElementById('btnSync');
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');

    const entryDate = document.getElementById('entryDate');
    const entryStatus = document.getElementById('entryStatus');
    const entryContent = document.getElementById('entryContent');
    const entryLink = document.getElementById('entryLink');

    entryDate.valueAsDate = new Date();

    const getFormData = () => ({
        date: entryDate.value,
        status: entryStatus.value,
        content: entryContent.value,
        link: entryLink.value
    });

    const clearForm = () => {
        entryContent.value = '';
        entryLink.value = '';
    };

    btnSaveSync.addEventListener('click', async () => {
        const data = getFormData();
        if (!data.content.trim()) {
            alert('Vui lòng nhập nội dung nhật ký!');
            return;
        }

        let localDiaries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        localDiaries.push({ ...data, id: Date.now().toString() });
        localStorage.setItem('diaryEntries', JSON.stringify(localDiaries));

        try {
            const response = await fetch('/api/diaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            await response.json();
            alert('Đã lưu và đồng bộ lên Cloud thành công!');
            clearForm();
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Lưu cục bộ thành công, nhưng lỗi đồng bộ Server!');
            clearForm();
        }
    });

    btnSync.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/sync', { method: 'POST' });
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            alert('Lỗi kết nối Server!');
        }
    });

    btnExport.addEventListener('click', () => {
        const data = localStorage.getItem('diaryEntries') || '[]';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diary_backup_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    btnImport.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (Array.isArray(importedData)) {
                        localStorage.setItem('diaryEntries', JSON.stringify(importedData));
                        alert('Nhập dữ liệu thành công!');
                    } else {
                        alert('File JSON không đúng định dạng!');
                    }
                } catch (err) {
                    alert('Lỗi đọc file JSON!');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });
});