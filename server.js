const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let diaryEntries = [];

app.get('/api/diaries', (req, res) => {
    res.json(diaryEntries);
});

app.post('/api/diaries', (req, res) => {
    const newEntry = {
        id: Date.now().toString(),
        date: req.body.date,
        status: req.body.status,
        content: req.body.content,
        link: req.body.link,
        createdAt: new Date()
    };
    diaryEntries.push(newEntry);
    console.log('Da luu:', newEntry);
    res.status(201).json({ message: 'OK', data: newEntry });
});

app.post('/api/sync', (req, res) => {
    setTimeout(() => {
        res.json({ message: 'Dong bo Cloud thanh cong!' });
    }, 1000);
});

app.listen(PORT, () => {
    console.log('Server chay tai http://localhost:' + PORT);
});