// src/routes/products.router.js

const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

// Instancia del Manager
const productManager = new ProductManager('products.json'); 
const router = Router();

// Middleware para manejo de errores centralizado (opcional pero recomendado)
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/products/ - Lista todos los productos
router.get('/', asyncHandler(async (req, res) => {
    const products = await productManager.getProducts();
    res.json(products);
}));

// GET /api/products/:pid - Trae solo el producto con el id proporcionado
router.get('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await productManager.getProductById(pid);

    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
}));

// POST /api/products/ - Agrega un nuevo producto
router.post('/', asyncHandler(async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        // 201 Created es el código apropiado para una creación exitosa
        res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
    } catch (error) {
        // 400 Bad Request para errores de validación de campos
        res.status(400).json({ error: error.message });
    }
}));

// PUT /api/products/:pid - Actualiza un producto por ID
router.put('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const updatedProduct = await productManager.updateProduct(pid, req.body);

    if (!updatedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
    }

    res.json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
}));

// DELETE /api/products/:pid - Elimina un producto por ID
router.delete('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const wasDeleted = await productManager.deleteProduct(pid);

    if (!wasDeleted) {
        return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
}));

module.exports = router;