import { Router } from 'express';
// Importamos el Manager que ya no necesita argumento de archivo
import ProductManager from '../managers/ProductManager.js'; 

const productManager = new ProductManager(); 
const router = Router();

// Middleware para manejar errores asíncronos de forma centralizada
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ===============================================
// GET /api/products - CON PAGINACIÓN Y FILTROS (CORREGIDO)
// ===============================================
router.get('/', asyncHandler(async (req, res) => {
    const { 
        limit = 10, 
        page = 1, 
        sort, 
        query, 
        category,
        availability 
    } = req.query;

    const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {}, // Ordenar por precio (1: asc, -1: desc)
        // Usaremos .lean() en el manager para obtener objetos JavaScript planos
    };

    // Construcción del filtro (criteria)
    const criteria = {};

    if (category) {
        criteria.category = category;
    }
    
    // El campo 'availability' en el query string se mapea al campo 'status' en el esquema
    if (availability !== undefined) {
        // En tu esquema (Product.model.js), 'status' es el campo booleano de disponibilidad
        criteria.status = availability === 'true'; // Convierte el string 'true'/'false' a booleano
    }

    // Lógica para búsqueda de texto (ej. por título o descripción)
    if (query) {
        // Usamos $or para buscar en múltiples campos
        criteria.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }


    try {
        // El Manager debe actualizar su método getProducts para aceptar criteria y options
        const productsData = await productManager.getProducts(criteria, options);

        // Desestructuramos para obtener las propiedades necesarias
        const { docs, totalPages, prevPage, nextPage, hasPrevPage, hasNextPage, page: currentPage } = productsData;
        
        // Generación de los links (URI)
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

        const generateLink = (pageNumber) => {
            const params = new URLSearchParams(req.query);
            params.set('page', pageNumber);
            return `${baseUrl}?${params.toString()}`;
        };

        const response = {
            status: 'success',
            payload: docs, // <--- ASEGURAMOS QUE LOS PRODUCTOS VAYAN EN EL PAYLOAD
            totalPages,
            prevPage, // Agregado para mayor detalle
            nextPage, // Agregado para mayor detalle
            page: currentPage,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? generateLink(prevPage) : null,
            nextLink: hasNextPage ? generateLink(nextPage) : null,
        };

        res.json(response);
    } catch (error) {
        // En caso de error de Mongoose o Manager
        res.status(500).json({ status: 'error', error: 'Error al obtener productos: ' + error.message });
    }
}));


// ===============================================
// GET /api/products/:pid
// ===============================================
router.get('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    
    try {
        const product = await productManager.getProductById(pid);

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
    
        res.json(product);
    } catch (error) {
         // Captura errores como CastError (ID con formato incorrecto)
        res.status(400).json({ error: 'ID de producto inválido: ' + error.message });
    }
}));


// ===============================================
// POST /api/products
// ===============================================
router.post('/', asyncHandler(async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        res.status(201).json({ message: 'Producto agregado exitosamente', product: newProduct });
    } catch (error) {
        // El manager lanza errores con mensajes específicos (ej. validación, código duplicado)
        res.status(400).json({ error: error.message });
    }
}));


// ===============================================
// PUT /api/products/:pid
// ===============================================
router.put('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    
    try {
        const updatedProduct = await productManager.updateProduct(pid, req.body);

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
        }

        res.json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
    } catch (error) {
        // Captura errores de validación de Mongoose o ID inválido
        res.status(400).json({ error: error.message });
    }
}));


// ===============================================
// DELETE /api/products/:pid
// ===============================================
router.delete('/:pid', asyncHandler(async (req, res) => {
    const { pid } = req.params;
    
    try {
        const wasDeleted = await productManager.deleteProduct(pid);

        if (!wasDeleted) {
            return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        // Captura errores por ID inválido
        res.status(400).json({ error: error.message });
    }
}));


export default router;