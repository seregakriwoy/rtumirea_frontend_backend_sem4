const express = require('express');
const { nanoid } = require('nanoid');

// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;
const cors = require("cors");

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let goods = [
    { id: nanoid(6), name: 'Колбаса', category: "Еда", discription: "Колбаса", cost: 300, amount_in_storage: 1 },
    { id: nanoid(6), name: 'Сыр', category: "Еда", discription: "Сыр", cost: 200, amount_in_storage: 2 },
    { id: nanoid(6), name: 'Колбасный сыр', category: "Еда", discription: "Сыр со вкусом колбасы", cost: 500, amount_in_storage: 3 },
];

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API управления товарами',
            version: '1.0.0',
            description: 'API для управления товарами интернет-магазина',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    // Путь к файлам, в которых мы будем писать JSDoc-комментарии
    apis: ['./api.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Good:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - cost
 *         - amount_in_storage
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         discription:
 *           type: string
 *           description: Описание товара
 *         cost:
 *           type: number
 *           description: Стоимость товара
 *         amount_in_storage:
 *           type: integer
 *           description: Количество товара на складе
 *       example:
 *         id: "abc123"
 *         name: "Колбаса"
 *         category: "Еда"
 *         discription: "Вкусная колбаса"
 *         cost: 300
 *         amount_in_storage: 10
 */

// Функция-помощник для получения товара из списка
function findGoodOr404(id, res) {
    const good = goods.find(u => u.id == id);
    if (!good) {
        res.status(404).json({ error: "Good not found" });
        return null;
    }
    return good;
}

/**
 * @swagger
 * /api/goods:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Goods]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - cost
 *               - amount_in_storage
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               discription:
 *                 type: string
 *               cost:
 *                 type: number
 *               amount_in_storage:
 *                 type: integer
 *           example:
 *             name: "Новый товар"
 *             category: "Еда"
 *             discription: "Описание товара"
 *             cost: 500
 *             amount_in_storage: 5
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Good'
 *       400:
 *         description: Ошибка валидации
 */
app.post("/api/goods", (req, res) => {
    const { name, category, discription, cost, amount_in_storage } = req.body;

    // Простейшая валидация
    if (!name || !category || cost === undefined || amount_in_storage === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const newGood = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        discription: discription ? discription.trim() : "",
        cost: Number(cost),
        amount_in_storage: Number(amount_in_storage)
    };
    goods.push(newGood);
    res.status(201).json(newGood);
});

/**
 * @swagger
 * /api/goods:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Goods]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Good'
 */
app.get("/api/goods", (req, res) => {
    res.json(goods);
});

/**
 * @swagger
 * /api/goods/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Goods]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Good'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const good = findGoodOr404(id, res);
    if (!good) return;
    res.json(good);
});

/**
 * @swagger
 * /api/goods/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Goods]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               discription:
 *                 type: string
 *               cost:
 *                 type: number
 *               amount_in_storage:
 *                 type: integer
 *           example:
 *             name: "Обновленное название"
 *             cost: 600
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Good'
 *       400:
 *         description: Нет полей для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const good = findGoodOr404(id, res);
    if (!good) return;

    // Нельзя PATCH без полей
    if (req.body?.name === undefined &&
        req.body?.category === undefined &&
        req.body?.discription === undefined &&
        req.body?.cost === undefined &&
        req.body?.amount_in_storage === undefined) {
        return res.status(400).json({
            error: "Nothing to update",
        });
    }

    const { name, category, discription, cost, amount_in_storage } = req.body;

    if (name !== undefined) good.name = name.trim();
    if (category !== undefined) good.category = category.trim();
    if (discription !== undefined) good.discription = discription.trim();
    if (cost !== undefined) good.cost = Number(cost);
    if (amount_in_storage !== undefined) good.amount_in_storage = Number(amount_in_storage);

    res.json(good);
});

/**
 * @swagger
 * /api/goods/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Goods]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/goods/:id", (req, res) => {
    const id = req.params.id;
    const exists = goods.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "Good not found" });

    goods = goods.filter((u) => u.id !== id);
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
    console.log(`Swagger документация доступна на http://localhost:${port}/api-docs`);
});