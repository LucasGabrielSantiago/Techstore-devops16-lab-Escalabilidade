// backend/routes/productRoutes.js
const express = require("express");

const router = express.Router(); // Cria uma instância do roteador do Express

// Faz o import do controlador de produtos
const productController = require("../controllers/productController");
const { authenticate } = require("../middlewares/auth"); // Middleware que exige token JWT

// Listar é público (catálogo da loja, usado também pelo teste de carga)
router.get("/", productController.listProducts);

// Criar, editar e apagar exigem login
router.post("/", authenticate, productController.createProduct);
router.put("/:id", authenticate, productController.updateProduct);
router.delete("/:id", authenticate, productController.deleteProduct);

module.exports = router;
