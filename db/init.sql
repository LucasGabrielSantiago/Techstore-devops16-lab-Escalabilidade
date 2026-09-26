-- ==========================================
-- TechStore - Schema inicial do banco
-- Executado automaticamente pelo container do PostgreSQL
-- apenas na PRIMEIRA inicialização (volume vazio).
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'customer',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Seed: dados migrados de backend/data/*.json
INSERT INTO users (name, email, password, role) VALUES
    ('Matheus', 'matheus@email.com', '$2b$10$OOgkxbLTxQ8wILk.iZc0curPdHdKI.KWfPxhABKkVilovNfkdiLD2', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, price, stock) VALUES
    ('Mouse Gamer RedDragon COBRA m711', 'Mouses gamers de entrada mais populares do mercado, famoso pelo excelente custo-benefício', 130.90, 20),
    ('Notebook Apple', 'Notebook teste', 1999.90, 5);
