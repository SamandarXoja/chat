import { body } from "express-validator";


export const registerValidator = [
    body('email').isEmail(),
    body('password').isLength({min: 5}),
    body('fullName').isLength({min: 3}),
    body('avatarUrl').optional().isURL(),

]


export const loginValidation = [
    body('email', 'Неверный формат почты').isEmail(),
    body('password', 'Пароль должен быть минимум 5 символов').isLength({min: 5}),
]


export const chatsCreateValidation = [
    body('text', 'Введите тексе').isLength({min: 1}).isString(),
]