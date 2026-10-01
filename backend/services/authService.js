const bcrypt = require("bcrypt");
const db = require("../db");
const { signToken } = require("../middlewares/auth");

const httpError = (status, message) => Object.assign(new Error(message), { status });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

// Valida os dados do cadastro
const validateRegister = ({ name, email, password }) => {
    if (!name || typeof name !== "string" || !name.trim()) {
        throw httpError(400, "Informe o seu nome.");
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        throw httpError(400, "Informe um e-mail válido.");
    }
    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD) {
        throw httpError(400, `A senha deve ter no mínimo ${MIN_PASSWORD} caracteres.`);
    }
};

// Registra um novo usuário
const register = async (data = {}) => {
    validateRegister(data);

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
        const { rows } = await db.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role`,
            [name, email, hashedPassword]
        );
        return rows[0];

    } catch (error) {
        // 23505 = violação de UNIQUE. Quem garante e-mail único é o banco,
        // então funciona mesmo com duas réplicas recebendo o mesmo cadastro ao mesmo tempo.
        if (error.code === "23505") throw httpError(400, "E-mail já cadastrado.");
        throw error;
    }
};

// Realiza o login: confere a senha e devolve o usuário + token JWT
const login = async ({ email, password } = {}) => {

    if (!email || !password) {
        throw httpError(401, "E-mail ou senha inválidos.");
    }

    const { rows } = await db.query(
        "SELECT id, name, email, password, role FROM users WHERE LOWER(email) = $1",
        [String(email).trim().toLowerCase()]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw httpError(401, "E-mail ou senha inválidos.");
    }

    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { user: publicUser, token: signToken(publicUser) };
};

// Busca os dados do usuário logado (a partir do id que veio no token)
const getById = async (id) => {
    const { rows } = await db.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",
        [id]
    );
    if (rows.length === 0) throw httpError(401, "Usuário não encontrado.");
    return rows[0];
};

module.exports = {
    register,
    login,
    getById
};
