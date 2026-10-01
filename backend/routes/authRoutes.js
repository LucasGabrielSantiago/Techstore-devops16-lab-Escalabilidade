const express = require("express"); // Importando o módulo Express

const router = express.Router(); // Criando uma instância do roteador Express

const authController = require("../controllers/authController"); // Importando o controlador de autenticação
const { authenticate } = require("../middlewares/auth"); // Middleware que exige token JWT

router.post("/login", authController.login); // Login: devolve o token JWT
router.post("/register", authController.register); // Cadastro de usuário
router.get("/me", authenticate, authController.me); // Dados do usuário logado (exige token)

// Exportando o roteador para ser usado em outros arquivos
module.exports = router;
