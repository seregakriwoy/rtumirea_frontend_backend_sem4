const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require("cors");

const app = express();
const port = 3000;

// Настройки Swagger - ДОЛЖНЫ быть до использования swaggerSpec
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API AUTH',
            version: '1.0.0',
            description: 'Простое API для изучения авторизации',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: [__filename], // Используем текущий файл вместо 'app.js'
};

// CORS настройки
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

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
let users = [];

function findUserOr404(username, res) {
    const user = users.find(u => u.username === username);
    if (!user) {
        res.status(404).json({ error: "user not found" });
        return null;
    }
    return user;
}

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function findGoodOr404(id, res) {
    const good = goods.find(g => g.id === id);
    if (!good) {
        res.status(404).json({ error: "Good not found" });
        return null;
    }
    return good;
}

// ============ ТОВАРЫ ============
let goods = [
    { id: nanoid(6), name: 'Колбаса', category: "Еда", discription: "Колбаса", cost: 300, amount_in_storage: 1 },
    { id: nanoid(6), name: 'Сыр', category: "Еда", discription: "Сыр", cost: 200, amount_in_storage: 2 },
    { id: nanoid(6), name: 'Колбасный сыр', category: "Еда", discription: "Сыр со вкусом колбасы", cost: 500, amount_in_storage: 3 },
];

// Swagger компоненты
/**
 * @swagger
 * components:
 *   schemas:
 *     Good:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         discription:
 *           type: string
 *         cost:
 *           type: number
 *         amount_in_storage:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   - name: Goods
 *     description: Управление товарами
 *   - name: Auth
 *     description: Авторизация и регистрация
 */

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
    if (req.body.name === undefined &&
        req.body.category === undefined &&
        req.body.discription === undefined &&
        req.body.cost === undefined &&
        req.body.amount_in_storage === undefined) {
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

// ============ АВТОРИЗАЦИЯ ============

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Создает нового пользователя с хешированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - age
 *             properties:
 *               username:
 *                 type: string
 *                 example: "ivan"
 *               password:
 *                 type: string
 *                 example: "qwerty123"
 *               age:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 age:
 *                   type: integer
 *                 hashedPassword:
 *                   type: string
 *       400:
 *         description: Некорректные данные
 */
app.post("/api/auth/register", async (req, res) => {
    const { username, age, password } = req.body;
    if (!username || !password || age === undefined) {
        return res.status(400).json({
            error: "username, password and age are required"
        });
    }
    
    // Проверка на существующего пользователя
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({
            error: "User already exists"
        });
    }
    
    const newUser = {
        username: username,
        age: Number(age),
        hashedPassword: await hashPassword(password)
    };
    users.push(newUser);
    res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет логин и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "ivan"
 *               password:
 *                 type: string
 *                 example: "qwerty123"
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: boolean
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required"
        });
    }
    
    const user = findUserOr404(username, res);
    if (!user) return;

    const isAuthenticated = await verifyPassword(password, user.hashedPassword);
    if (isAuthenticated) {
        res.status(200).json({ login: true });
    } else {
        res.status(401).json({ error: "not authenticated" });
    }
});

// ============ SWAGGER UI (ДОЛЖЕН БЫТЬ ПОСЛЕ ВСЕХ МАРШРУТОВ) ============
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============ ЗАПУСК СЕРВЕРА ============
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});