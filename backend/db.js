// Conexão com o PostgreSQL usando um pool de conexões.
// Cada réplica da API tem o seu próprio pool, mas todas acessam o MESMO banco:
// é isso que deixa a aplicação "stateless" e permite escalar horizontalmente.
const { Pool, types } = require("pg");

// O PostgreSQL devolve NUMERIC como string; convertemos para número (campo price)
types.setTypeParser(1700, (value) => parseFloat(value));

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "techstore",
    password: process.env.DB_PASSWORD || "techstore",
    database: process.env.DB_NAME || "techstore",
    max: Number(process.env.DB_POOL_MAX || 10) // conexões por réplica
});

pool.on("error", (err) => {
    console.error("Erro inesperado no pool do PostgreSQL:", err.message);
});

module.exports = pool;
