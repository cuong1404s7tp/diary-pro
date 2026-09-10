const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kzgswoguanoonawipswdw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OWfSSt2YwyPaXTnUDzxOGw_3G4ThXva';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/diaries', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('diary_entries')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        const result = (data || []).map(e => ({
            id: e.entry_id,
            date: e.date,
            content: e.content,
            link: e.link || '',
            status: e.status || 'dang_lam',
            category: e.category || 'ca_nhan'
        }));

        res.json(result);
    } catch (err) {
        console.error('❌ Lỗi GET:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/diaries', async (req, res) => {
    try {
        const entries = req.body;

        if (!Array.isArray(entries)) {
            return res.status(400).json({ error: 'Dữ liệu phải là mảng' });
        }

        const { error: delErr } = await supabase
            .from('diary_entries')
            .delete()
            .neq('id', 0);

        if (delErr) throw delErr;

        if (entries.length > 0) {
            const docs = entries.map(e => ({
                entry_id: String(e.id),
                date: e.date,
                content: e.content,
                link: e.link || '',
                status: e.status || 'dang_lam',
                category: e.category || 'ca_nhan',
                user_id: 'default_user'
            }));

            const { error: insErr } = await supabase
                .from('diary_entries')
                .insert(docs);

            if (insErr) throw insErr;
        }

        console.log('✅ Đã lưu', entries.length, 'entries lên Supabase');
        res.status(201).json({ message: 'Đã lưu vào Supabase', count: entries.length });
    } catch (err) {
        console.error('❌ Lỗi POST:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sync', (req, res) => {
    res.json({ message: 'Đồng bộ Cloud thành công!' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('🚀 Server chạy tại http://localhost:' + PORT);
    console.log('📊 Supabase URL:', SUPABASE_URL);
});