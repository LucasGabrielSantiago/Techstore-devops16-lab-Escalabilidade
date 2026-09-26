const bcrypt = require("bcrypt");
const db = require("../db");

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Registra um novo usuário
const register = async ({ name, email, password } = {}) => {

    if (!name || !email || !password) {
        throw httpError(400, "Nome, e-mail e senha são obrigatórios.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

// Realiza o login do usuário
const login = async ({ email, password } = {}) => {

    if (!email || !password) {
        throw httpError(401, "E-mail ou senha inválidos.");
    }

    const { rows } = await db.query(
        "SELECT id, name, email, password, role FROM users WHERE email = $1",
        [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw httpError(401, "E-mail ou senha inválidos.");
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role };
};

module.exports = {
    register,
    login
};
