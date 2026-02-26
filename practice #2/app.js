const express = require('express');
const app = express();
const port = 3000;

let goods = [
    { id: 1, name: 'Колбаса', cost: 300 },
    { id: 2, name: 'Сыр', cost: 200 },
    { id: 3, name: 'Колбасный сыр', cost: 500 },
]

// Middleware для парсинга JSON
app.use(express.json());
// Главная страница
app.get('/', (req, res) => {
    res.send('Главная страница');
});

// CRUD
app.post('/goods', (req, res) => {
    const { name, cost } = req.body;
    const newGood = {
        id: Date.now(),
        name,
        cost
    };
    goods.push(newGood);
    res.status(201).json(newGood);
});

app.get('/goods'
    , (req, res) => {
        res.send(JSON.stringify(goods));
    });

app.get('/goods/:id'
    , (req, res) => {
        let good = goods.find(u => u.id == req.params.id);
        res.send(JSON.stringify(good));
    });

app.patch('/goods/:id', (req, res) => {
        const good = goods.find(u => u.id == req.params.id);
        const { name, cost } = req.body;
        if (name !== undefined) good.name = name;
        if (cost !== undefined) good.cost = cost;
        res.json(good);
    });

app.delete('/goods/:id', (req, res) => {
        goods = goods.filter(u => u.id != req.params.id);
        res.send('Ok');
    });

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});