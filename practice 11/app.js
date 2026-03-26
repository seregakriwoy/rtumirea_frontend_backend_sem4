const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require("cors");

const app = express();
const port = 3000;

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

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
    apis: [__filename],
};

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let users = [];
const refreshTokens = new Set();

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role,
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }
        next();
    };
}

function findGoodOr404(id, res) {
    const good = goods.find(g => g.id === id);
    if (!good) {
        res.status(404).json({ error: "Good not found" });
        return null;
    }
    return good;
}

let goods = [
    { id: nanoid(6), name: 'Колбаса', category: "Еда", discription: "Колбаса", cost: 300, amount_in_storage: 1 },
    { id: nanoid(6), name: 'Сыр', category: "Еда", discription: "Сыр", cost: 200, amount_in_storage: 2 },
    { id: nanoid(6), name: 'Колбасный сыр', category: "Еда", discription: "Сыр со вкусом колбасы", cost: 500, amount_in_storage: 3 },
];

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
app.post("/api/goods", authMiddleware,  roleMiddleware(["seller", "admin"]), (req, res) => {
    const { name, category, discription, cost, amount_in_storage } = req.body;

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

app.put("/api/goods/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const id = req.params.id;
    const { name, category, discription, cost, amount_in_storage } = req.body;
    
    const goodIndex = goods.findIndex(g => g.id === id);
    
    if (goodIndex === -1) {
        return res.status(404).json({ error: "Good not found" });
    }
    
    if (!name || !category || cost === undefined || amount_in_storage === undefined) {
        return res.status(400).json({ error: "Missing required fields: name, category, cost, amount_in_storage" });
    }
    
    const updatedGood = {
        id: id,
        name: name.trim(),
        category: category.trim(),
        discription: discription ? discription.trim() : "",
        cost: Number(cost),
        amount_in_storage: Number(amount_in_storage)
    };
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
app.get("/api/goods", authMiddleware,  roleMiddleware(["user", "seller", "admin"]),(req, res) => {
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
app.get("/api/goods/:id", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
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
app.patch("/api/goods/:id", authMiddleware, (req, res) => {
    const id = req.params.id;
    const good = findGoodOr404(id, res);
    if (!good) return;

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
app.delete("/api/goods/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const id = req.params.id;
    const exists = goods.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "Good not found" });

    goods = goods.filter((u) => u.id !== id);
    res.status(204).send();
});

app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({
            error: "User not found",
        });
    }

    res.json({
        id: user.id,
        username: user.username,
    });
});

app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required",
        });
    }

    const exists = users.some((u) => u.username === username);
    if (exists) {
        return res.status(409).json({
            error: "username already exists",
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        id: String(users.length + 1),
        username,
        passwordHash,
        role: "user"
    };
    users.push(user);
    res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required",
        });
    }

    const user = users.find((u) => u.username === username);
    if (!user) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken,
    });
});

app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required",
        });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({
            error: "Invalid refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);

        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

app.get("/api/protected-route",
    authMiddleware, roleMiddleware(["seller", "admin"]),
    (req, res) => {
        res.json({
            message: "Protected route for seller or admin",
            user: req.user
        });
    }
);
// доступ только админу
app.get("/api/protected-admin-route",
    authMiddleware, roleMiddleware(["admin"]),
    (req, res) => {
        res.json({
            message: "Admin only route",
            user: req.user
        });
    }
);

app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const safeUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive
  }));
  res.json(safeUsers);
});

app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive
  });
});

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { username, role, isActive } = req.body;

  if (username !== undefined) {
    // Проверяем, не занято ли новое имя
    const existingUser = findUserByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({ error: "Username already exists" });
    }
    user.username = username;
  }

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive
  });
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Блокируем пользователя (soft delete)
  user.isActive = false;

  res.json({
    message: "User blocked successfully",
    user: {
      id: user.id,
      username: user.username,
      isActive: user.isActive
    }
  });
});

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});