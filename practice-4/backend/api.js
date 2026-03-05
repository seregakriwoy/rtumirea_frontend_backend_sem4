const express = require('express');
const { nanoid } = require('nanoid');
const app = express();
const port = 3000;
const cors = require("cors");

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

let goods = [
    { id: nanoid(6), name: 'Колбаса', category: "Еда", discription: "Колбаса", cost: 300, amount_in_storage: 1 },
    { id: nanoid(6), name: 'Сыр', category: "Еда", discription: "Сыр", cost: 200, amount_in_storage:2 },
    { id: nanoid(6), name: 'Колбасный сыр', category: "Еда", discription: "Сыр со вкусом колбасы", cost: 500, amount_in_storage:3 },
]

// Middleware для парсинга JSON
app.use(express.json());
// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}]
${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method ===
            'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});
// Функция-помощник для получения пользователя из списка
function findGoodOr404(id, res) {
    const good = goods.find(u => u.id == id);
    if (!good) {
        res.status(404).json({ error: "Good not found" });
        return null;
    }
    return good;
}
// Функция-помощник
// POST /api/goods
app.post("/api/goods", (req, res) => {
    const { name, category, discription, cost, amount_in_storage } = req.body;
    const newGood = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        discription: discription.trim(),
        cost: Number(cost),
        amount_in_storage: Number(amount_in_storage)
    };
    goods.push(newGood);
    res.status(201).json(newGood);
});
// GET /api/goods
app.get("/api/goods", (req, res) => {
    res.json(goods);
});
// GET /api/goods/:id
app.get("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const goods = findGoodsOr404(id, res);
    if (!good) return;
    res.json(good);
});
// PATCH /api/goods/:id
app.patch("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const good = findGoodOr404(id, res);
    if (!good) return;
    // Нельзя PATCH без полей
    if (req.body?.name === undefined && req.body?.age === undefined) {
        return res.status(400).json({
            error: "Nothing to update",
        });
    }
    const { name, category, discription, cost, amount_in_storage } = req.body;
    if (name !== undefined) good.name = name.trim();
    if (category !== undefined) good.category = category.trim();
    if (discription !== undefined) good.discription = discription.trim();
    if (cost !== undefined) good.cost = Number(cost);
    if (amount_in_storage !== undefined) good.amount_in_storage = Number(cost);
    res.json(good);
});
// DELETE /api/goods/:id
app.delete("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const exists = goods.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "Good not found" });
    goods = goods.filter((u) => u.id !== id);
    // Правильнее 204 без тела
    res.status(204).send();
});
// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});
// Глобальный обработчик ошибок (чтобы сервер не падал)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});