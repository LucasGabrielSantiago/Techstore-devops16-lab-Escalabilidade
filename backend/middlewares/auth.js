// ==========================================
// Autenticação com JWT
//
// Por que JWT e não sessão em memória?
// A API roda em várias réplicas atrás do Nginx. Uma sessão guardada na
// memória de uma réplica não existiria nas outras: o usuário "cairia" toda
// vez que o Nginx o mandasse para outra réplica. O token JWT carrega quem é
// o usuário e é assinado com JWT_SECRET; qualquer réplica valida sozinha.
// Por isso TODAS as réplicas precisam usar a MESMA JWT_SECRET.
// ==========================================
const jwt = require("jsonwebtoken");

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não definida.");
    return secret;
};

// Gera o token com os dados mínimos do usuário (nunca a senha)
const signToken = (user) => jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
);

// Middleware: exige "Authorization: Bearer <token>"
const authenticate = (req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Não autenticado." });
    }

    try {
        const payload = jwt.verify(token, getSecret());
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        return next();
    } catch (error) {
        const message = error.name === "TokenExpiredError"
            ? "Sessão expirada. Entre novamente."
            : "Token inválido.";
        return res.status(401).json({ message });
    }
};

module.exports = {
    signToken,
    authenticate
};
