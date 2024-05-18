import express from "express";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import { registerValidator, loginValidation, chatsCreateValidation } from './validations/auth.js';
import { validationResult } from 'express-validator';
import UserModel from './models/Users.js';
import bcrypt from 'bcryptjs';
import http from 'http';
import { Server } from "socket.io";
import Chat from "./models/Chat.js";
import cors from 'cors';

mongoose.connect('mongodb+srv://samandarsaidahmadov98:8787172ss@cluster0.soqylcu.mongodb.net/chats?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    console.log('DB ok');
}).catch((err) => console.log('DB error', err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://chat-react-js.vercel.app', 'http://localhost:5174','http://localhost:5173'],
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5555;

app.use(cors({
    origin: ['https://chat-react-js.vercel.app', 'http://localhost:5174','http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://chat-react-js.vercel.app', 'http://localhost:5173', 'http://localhost:5174');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(express.json());

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('newChatMessage', async (messageData) => {
        try {
            const { text } = messageData;
            const newChatMessage = new Chat({ text });
            await newChatMessage.save();

            io.emit('chatMessage', newChatMessage);
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

app.post('/auth/login', loginValidation, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный пароль' });
        }

        const token = jwt.sign({ _id: user.id }, 'secret123', { expiresIn: '30d' });
        const { passwordHash, ...userData } = user._doc;

        res.json({ ...userData, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ошибка' });
    }
});

app.post('/auth/register', registerValidator, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errors.array());
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash,
        });

        const user = await doc.save();
        const token = jwt.sign({ _id: user._id }, 'secret123', { expiresIn: '30d' });
        const { passwordHash, ...userData } = user._doc;

        res.json({ ...userData, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Не удалось зарегистрироваться' });
    }
});

app.post('/chats', chatsCreateValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text } = req.body;
        const newChatMessage = new Chat({ text });
        await newChatMessage.save();

        io.emit('chatMessage', newChatMessage);
        res.status(201).json(newChatMessage);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ошибка при отправке сообщения чата' });
    }
});

app.delete('/chats/:id', async (req, res) => {
    const chatId = req.params.id;

    try {
        const deletedChat = await Chat.findByIdAndDelete(chatId);

        if (!deletedChat) {
            return res.status(404).json({ message: 'Чат не найден' });
        }

        res.status(200).json({ message: 'Чат успешно удален', deletedChat });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ошибка при удалении чата' });
    }
});

app.get('/chats', async (req, res) => {
    try {
        const chats = await Chat.find();
        res.json(chats);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ошибка при получении списка чатов' });
    }
});

server.listen(PORT, (err) => {
    if (err) {
        return console.log(err);
    }
    console.log(`Server is running on port ${PORT}`);
});
