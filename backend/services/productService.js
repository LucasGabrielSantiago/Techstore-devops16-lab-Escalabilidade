const db = require("../db");

// Erro com status HTTP, para o controller saber o que responder
const httpError = (status, message) => Object.assign(new Error(message), { status });

// Valida os campos recebidos (partial = true no update, onde nada é obrigatório)
const validate = ({ name, price, stock }, partial = false) => {
    if (!partial && (!name || typeof name !== "string")) {
        throw httpError(400, "O campo 'name' é obrigatório.");
    }
    if ((!partial || price !== undefined) && (typeof price !== "number" || price < 0)) {
        throw httpError(400, "O campo 'price' deve ser um número maior ou igual a zero.");
    }
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
        throw httpError(400, "O campo 'stock' deve ser um inteiro maior ou igual a zero.");
    }
};

const COLUMNS = "id, name, description, price, stock";

// Lista todos os produtos
const getProducts = async () => {
    const { rows } = await db.query(`SELECT ${COLUMNS} FROM products ORDER BY id`);
    return rows;
};

// Cria (cadastra) um novo produto — o ID é gerado pelo banco (SERIAL),
// então duas réplicas criando ao mesmo tempo nunca geram IDs repetidos
const createProduct = async (data = {}) => {
    validate(data);
    const { name, description = null, price, stock = 0 } = data;

    const { rows } = await db.query(
        `INSERT INTO products (name, description, price, stock)
         VALUES ($1, $2, $3, $4)
         RETURNING ${COLUMNS}`,
        [name, description, price, stock]
    );
    return rows[0];
};

// Atualiza um produto existente (só os campos enviados)
const updateProduct = async (id, data = {}) => {
    validate(data, true);
    const { name, description, price, stock } = data;

    const { rows } = await db.query(
        `UPDATE products SET
            name        = COALESCE($1, name),
            description = COALESCE($2, description),
            price       = COALESCE($3, price),
            stock       = COALESCE($4, stock),
            updated_at  = NOW()
         WHERE id = $5
         RETURNING ${COLUMNS}`,
        [name ?? null, description ?? null, price ?? null, stock ?? null, Number(id)]
    );

    if (rows.length === 0) throw httpError(404, "Produto não encontrado.");
    return rows[0];
};

// Exclui um produto
const deleteProduct = async (id) => {
    const { rows } = await db.query(
        `DELETE FROM products WHERE id = $1 RETURNING ${COLUMNS}`,
        [Number(id)]
    );

    if (rows.length === 0) throw httpError(404, "Produto não encontrado.");
    return rows[0];
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
