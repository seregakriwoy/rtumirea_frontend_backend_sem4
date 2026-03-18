const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;
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
    apis: ['app.js'],
};
let users = [];
function findUserOr404(username, res) {
    const user = users.find(u => u.username == username);
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
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
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
 *                   example: "ivan"
 *                 age:
 *                   type: integer
 *                   example: 20
 *                 hashedPassword:
 *                   type: string
 *                   example: "$2b$10$kO6Hq7ZKfV4cPzGm8u7mEuR7r4Xx2p9mP0q3t1yZbCq9Lh5a8b1QW"
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "username, password and age are required"
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
    isAuthentethicated = await verifyPassword(password,
        user.hashedPassword);
    if (isAuthentethicated) {
        res.status(200).json({ login: true });
    }
    else {
        res.status(401).json({ error: "not authentethicated" })
    }
});
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});