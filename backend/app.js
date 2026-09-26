require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env

// Importando as dependências necessárias
const os = require("os");
const express = require("express");
const cors = require("cors");

const routes = require("./routes"); // Importando as rotas da API

// Criando uma instância do aplicativo Express
const app = express();

// Middlewares
// exposedHeaders: permite que o frontend leia o X-Instance mesmo rodando em outra origem (ex.: Live Server)
app.use(cors({ exposedHeaders: ["X-Instance"] }));
app.use(express.json());

// Toda resposta informa qual réplica (container) a atendeu
app.use((req, res, next) => {
    res.set("X-Instance", os.hostname());
    next();
});

app.use("/api", routes); // Registrando as rotas da API com o prefixo "/api"

module.exports = app;
