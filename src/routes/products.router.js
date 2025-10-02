const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const productManager = new ProductManager('products.json'); 
const router = Router();

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(async (req, res) => {
    const products = await productManager.getProducts();
    res.json(products);
}));

router.get('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await productManager.getProductById(pid);

    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
}));

router.post('/', asyncHandler(async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}));

router.put('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const updatedProduct = await productManager.updateProduct(pid, req.body);

    if (!updatedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
    }

    res.json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
}));

router.delete('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const wasDeleted = await productManager.deleteProduct(pid);

    if (!wasDeleted) {
        return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
}));

module.exports = router;