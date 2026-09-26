// Importando as dependências necessárias
const os = require("os");
const express = require("express");

const db = require("../db");

const router = express.Router(); // Criando uma instância do roteador Express

const authRoutes = require("./authRoutes"); // Importando as rotas de autenticação
const productRoutes = require("./productRoutes"); // Importando as rotas de produtos

// Liveness: o processo está de pé?
// "instance" mostra QUAL réplica respondeu (hostname do container),
// o que deixa o balanceamento de carga visível na demonstração.
router.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        application: "TechStore API",
        version: "2.0.0",
        instance: os.hostname()
    });
});

// Readiness: a réplica consegue atender (banco acessível)?
// Usado pelo healthcheck do Docker Compose.
router.get("/ready", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.status(200).json({ status: "ready", instance: os.hostname() });
    } catch (error) {
        res.status(503).json({ status: "unavailable", instance: os.hostname(), error: error.message });
    }
});

//Rotas de autenticação
router.use("/auth", authRoutes); // Usando as rotas de autenticação com o prefixo "/auth"
router.use("/products", productRoutes); // Usando as rotas de produtos com o prefixo "/products"

module.exports = router;
