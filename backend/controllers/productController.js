const productService = require("../services/productService"); // Faz o import do serviço de produtos

// Envia o erro com o status correto (400, 404...) ou 500 se for um erro inesperado
const handleError = (res, error) => {
    if (!error.status) console.error(error);
    return res.status(error.status || 500).json({
        message: error.status ? error.message : "Erro interno do servidor."
    });
};

// Função para listar todos os produtos
const listProducts = async (req, res) => {
    try {
        const products = await productService.getProducts();
        return res.status(200).json(products);
    } catch (error) {
        return handleError(res, error);
    }
};

// Função para criar (cadastrar) um novo produto
const createProduct = async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        return res.status(201).json({
            message: "Produto cadastrado com sucesso.",
            product
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Função para atualizar um produto existente
const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        return res.status(200).json({
            message: "Produto atualizado com sucesso.",
            product
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Função para deletar um produto existente
const deleteProduct = async (req, res) => {
    try {
        const product = await productService.deleteProduct(req.params.id);
        return res.status(200).json({
            message: "Produto removido com sucesso.",
            product
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = { // Exporta as funções do controller para serem utilizadas em outros arquivos
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
