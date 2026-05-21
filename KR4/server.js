const { Pool } = require('pg');
const express = require('express');
const app = express();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fbr',
    password: '1234',
    port: 5432,
});

const { Sequelize, DataTypes } = require('sequelize');

app.use(express.json());

const sequelize = new Sequelize('fbr', 'postgres', '1234', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432
});
// Проверка подключения
sequelize.authenticate()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err));

const User = sequelize.define('User', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false }
});

const Task = sequelize.define('Task', {
    title: { type: DataTypes.STRING },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});
// Связь 1:N
User.hasMany(Task);
Task.belongsTo(User);
// Синхронизация с БД
sequelize.sync({ force: true });

app.post('/users', async (req, res) => {
        try {
            const user = await User.create(req.body);
            res.status(201).send(user);
        } catch (err) {
            res.status(400).send(err.message);
        }
    });

app.get('/users', async (req, res) => {
        try {
            const users = await User.findAll({ include: Task });
            res.send(users);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

app.get('/users/:id', async(req, res)  => {
    try {
        const user = await User.findAll({where: {id: req.params.id}})
        res.send(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.patch('/users/:id', async (req, res) => {
        try {
            const user = await User.update(req.body, {
                where: { id: req.params.id },
                returning: true, // Для PostgreSQL (возвращает обновленную
            });
            res.send(user);
        } catch (err) {
            res.status(400).send(err.message);
        }
    });

app.delete('/users/:id', async (req, res) => {
        try {
            await User.destroy({ where: { id: req.params.id } });
            res.send({ message: 'User deleted' });
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

app.listen(1001, () => {
    console.log('Server is running on http://localhost:1001');
});
