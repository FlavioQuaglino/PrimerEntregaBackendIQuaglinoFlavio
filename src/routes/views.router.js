import { Router } from 'express';
// Usamos los Managers que ya están configurados para Mongoose
import ProductManager from '../managers/ProductManager.js'; 
import CartManager from '../managers/CartManager.js';

const productManager = new ProductManager(); 
const cartManager = new CartManager();
const router = Router();

// ID de carrito fijo para la demo (debes asegurarte de que este ID exista en tu MongoDB)
// Si no quieres crear un carrito manualmente, puedes poner '69092369c5a306f1d13ffac1'
// si usaste el ID que se vio en la captura de pantalla anterior.
const DEMO_CART_ID = '69092369c5a306f1d13ffac1'; // ⬅️ Usamos un ID de ejemplo

// ===============================================
// GET / - Vista Home (Paginada)
// ===============================================
router.get('/', async (req, res) => {
    // 1. Obtener parámetros de Query para la paginación y filtros
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
        sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {},
        lean: true, // Importante: Mongoose devuelve documentos, 'lean: true' los convierte a objetos JS planos para Handlebars.
    };

    // Construcción del filtro (criteria), similar al API Router
    const criteria = {};

    if (category) {
        criteria.category = category;
    }
    
    if (availability !== undefined) {
        criteria.status = availability === 'true'; 
    }

    if (query) {
        criteria.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    
    try {
        const productsData = await productManager.getProducts(criteria, options);

        const { docs, totalPages, prevPage, nextPage, hasPrevPage, hasNextPage, page: currentPage } = productsData;
        
        // Generación de links y manejo de parámetros de query
        const getQueryString = (pageNumber) => {
            const params = new URLSearchParams(req.query);
            params.set('page', pageNumber);
            // Aseguramos que 'page' sea el único parámetro que cambia.
            return `?${params.toString()}`;
        };

        const context = {
            products: docs,
            title: 'Lista de Productos (Paginada)',
            activeCartId: DEMO_CART_ID, // ⬅️ AGREGADO: ID del carrito activo para el frontend
            // Datos de paginación para Handlebars
            currentPage,
            totalPages,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? getQueryString(prevPage) : null,
            nextLink: hasNextPage ? getQueryString(nextPage) : null,
            // Mantener filtros en la vista
            currentLimit: limit,
            currentSort: sort,
            currentQuery: query,
            currentCategory: category,
            currentAvailability: availability,
        };
        
        res.render('home', context); 
    } catch (error) {
        console.error('Error al cargar la vista home:', error);
        // Deberías tener una plantilla 'error.handlebars'
        res.status(500).render('error', { title: 'Error', message: 'No se pudieron cargar los productos o la paginación falló.' });
    }
});

// ===============================================
// GET /realtimeproducts - Vista de Productos en Tiempo Real (WebSockets)
// ===============================================
router.get('/realtimeproducts', async (req, res) => {
    try {
        // En esta vista solo se necesita renderizar la plantilla, 
        // la lista inicial se obtiene luego vía Socket.IO en app.js
        const initialProducts = await productManager.getProducts({}, { limit: 100, lean: true });
        
        res.render('realTimeProducts', { 
            title: 'Productos en Tiempo Real (Mongoose)',
            products: initialProducts.docs // Pasamos el array de productos inicial
        });

    } catch (error) {
        console.error('Error al cargar la vista realTimeProducts:', error);
        res.status(500).render('error', { title: 'Error', message: 'Error al cargar la vista en tiempo real.' });
    }
});


// ===============================================
// GET /carts/:cid - Vista de Carrito
// ===============================================
router.get('/carts/:cid', async (req, res) => {
    const { cid } = req.params;
    
    try {
        // Obtenemos el carrito con POPULATE (productos completos)
        const cart = await cartManager.getCartById(cid);

        if (!cart) {
            return res.status(404).render('error', { title: 'Error 404', message: `Carrito con ID ${cid} no encontrado.` });
        }

        // El objeto 'cart' ya tiene los productos populados para Handlebars
        res.render('cart', { 
            title: `Carrito ID: ${cid}`, 
            cartId: cid,
            products: cart.products.map(item => ({
                // Flattening object structure for easier use in Handlebars
                productId: item.product._id,
                title: item.product.title,
                price: item.product.price,
                quantity: item.quantity
            })),
            cart
        });
    } catch (error) {
        console.error('Error al cargar la vista del carrito:', error.message);
        res.status(400).render('error', { title: 'Error', message: 'ID de carrito inválido o error interno.' });
    }
});


export default router;