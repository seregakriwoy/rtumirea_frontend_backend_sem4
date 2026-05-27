const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
const { nanoid } = require("nanoid");
const app = express();
app.use(express.json());
const PORT = 3000;

// Секреты подписи
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Время хранения кэша
const USERS_CACHE_TTL = 60; // 1 минута
const PRODUCTS_CACHE_TTL = 600; // 10 минут

// { id, username, passwordHash, role, blocked }
const users = [];
// { id, name, price, description }
const products = [];

// Хранилище refresh-токенов
const refreshTokens = new Set();

// Redis client
const redisClient = createClient({
    url: "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

async function initRedis() {
    await redisClient.connect();
    console.log("Redis connected");
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
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
            role: user.role
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

// Auth middleware
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
        const user = users.find((u) => u.id === payload.sub);

        if (!user || user.blocked) {
            return res.status(401).json({
                error: "User not found or blocked",
            });
        }

        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

// Role middleware
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

// Middleware чтения из кэша
function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                return res.json({
                    source: "cache",
                    data: JSON.parse(cachedData)
                });
            }

            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error("Cache read error:", err);
            next();
        }
    };
}

// Сохранение ответа в кэш
async function saveToCache(key, data, ttl) {
    try {
        await redisClient.set(key, JSON.stringify(data), {
            EX: ttl
        });
    } catch (err) {
        console.error("Cache save error:", err);
    }
}

// Удаление кэша пользователей
async function invalidateUsersCache(userId = null) {
    try {
        await redisClient.del("users:all");
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
    } catch (err) {
        console.error("Users cache invalidate error:", err);
    }
}

// Удаление кэша товаров
async function invalidateProductsCache(productId = null) {
    try {
        await redisClient.del("goods:all");
        if (productId) {
            await redisClient.del(`goods:${productId}`);
        }
    } catch (err) {
        console.error("Products cache invalidate error:", err);
    }
}

let goods = [
    { id: nanoid(6), name: 'Колбаса', category: "Еда", description: "Колбаса", cost: 300, amount_in_storage: 1 },
    { id: nanoid(6), name: 'Сыр', category: "Еда", description: "Сыр", cost: 200, amount_in_storage: 2 },
    { id: nanoid(6), name: 'Колбасный сыр', category: "Еда", description: "Сыр со вкусом колбасы", cost: 500, amount_in_storage: 3 },
];

// ---------------- AUTH ----------------
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

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
            role: role || "user",
            blocked: false
        };

        users.push(user);

        res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
            blocked: user.blocked
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "username and password are required",
            });
        }

        const user = users.find((u) => u.username === username);
        if (!user || user.blocked) {
            return res.status(401).json({
                error: "Invalid credentials or user is blocked",
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
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/auth/refresh", (req, res) => {
    try {
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

        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);

        if (!user || user.blocked) {
            return res.status(401).json({
                error: "User not found or blocked",
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

app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
    try {
        const user = users.find((u) => u.id === req.user.sub);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            blocked: user.blocked
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ---------------- USERS ----------------
// Получить список пользователей (кэш 1 минута)
app.get(
    "/api/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
    async (req, res) => {
        try {
            const data = users.map((u) => ({
                id: u.id,
                username: u.username,
                role: u.role,
                blocked: u.blocked
            }));

            await saveToCache(req.cacheKey, data, req.cacheTTL);

            res.json({
                source: "server",
                data
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Получить пользователя по id (кэш 1 минута)
app.get(
    "/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        try {
            const user = users.find((u) => u.id === req.params.id);

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const data = {
                id: user.id,
                username: user.username,
                role: user.role,
                blocked: user.blocked
            };

            await saveToCache(req.cacheKey, data, req.cacheTTL);

            res.json({
                source: "server",
                data
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Обновить пользователя
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    try {
        const { username, role, blocked } = req.body;
        const user = users.find((u) => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Валидация роли
        const validRoles = ["user", "seller", "admin"];
        if (role !== undefined && !validRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role. Allowed roles: user, seller, admin"
            });
        }

        // Обновление полей
        if (username !== undefined) user.username = username;
        if (role !== undefined) user.role = role;
        if (blocked !== undefined) user.blocked = blocked;

        await invalidateUsersCache(user.id);

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            blocked: user.blocked
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Удалить пользователя
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    try {
        const userIndex = users.findIndex((u) => u.id === req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const deletedUser = users.splice(userIndex, 1)[0];

        // Удаляем refresh токены пользователя
        for (const token of refreshTokens) {
            try {
                const payload = jwt.verify(token, REFRESH_SECRET);
                if (payload.sub === deletedUser.id) {
                    refreshTokens.delete(token);
                }
            } catch (err) {
                refreshTokens.delete(token);
            }
        }

        await invalidateUsersCache(deletedUser.id);

        res.json({
            message: "User deleted successfully",
            id: deletedUser.id,
            username: deletedUser.username
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ---------------- PRODUCTS ----------------
// Получить все товары
app.get("/api/products", authMiddleware, roleMiddleware(["user", "seller", "admin"]), cacheMiddleware(() => "goods:all", PRODUCTS_CACHE_TTL), async (req, res) => {
    try {
        const data = goods.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            cost: item.cost,
            amount_in_storage: item.amount_in_storage
        }));

        await saveToCache(req.cacheKey, data, req.cacheTTL);

        res.json({
            source: "server",
            data
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Получить товар по id
app.get("/api/products/:id", authMiddleware, roleMiddleware(["user", "seller", "admin"]), cacheMiddleware((req) => `goods:${req.params.id}`, PRODUCTS_CACHE_TTL), async (req, res) => {
    try {
        const product = goods.find((item) => item.id === req.params.id);

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        const data = {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            cost: product.cost,
            amount_in_storage: product.amount_in_storage
        };

        await saveToCache(req.cacheKey, data, req.cacheTTL);

        res.json({
            source: "server",
            data
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Запуск сервера
initRedis().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to initialize Redis:", error);
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT} (без Redis кэширования)`);
    });
});