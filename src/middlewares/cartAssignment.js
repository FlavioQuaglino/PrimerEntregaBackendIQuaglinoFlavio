import CartManager from '../managers/CartManager.js';
import mongoose from 'mongoose';

/**
 * Middleware para asegurar que el usuario tenga un cartId asociado a su sesión.
 * Si no existe un cartId en la sesión, crea un nuevo carrito y lo guarda en la sesión.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar al siguiente middleware/handler.
 */
const initializeCart = async (req, res, next) => {
    // Nota: Para este examen, asumimos que el usuario no está logueado 
    // y usamos req.session.cartId para la persistencia.

    let cartId = req.session.cartId;

    if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
        console.log("No hay cartId en sesión o es inválido. Creando nuevo carrito...");
        try {
            // 1. Crear un nuevo carrito en la DB
            const newCart = await CartManager.createCart();
            
            // 2. Guardar el ID del nuevo carrito en la sesión
            req.session.cartId = newCart._id.toString();
            console.log(`Nuevo carrito creado y asignado a sesión: ${req.session.cartId}`);

            // 3. Opcional: Reutilizar el ID del carrito para la respuesta
            res.locals.cartId = req.session.cartId;
            
        } catch (error) {
            console.error('ERROR en el middleware initializeCart:', error.message);
            // Si falla la DB, no podemos continuar de forma segura
            return res.status(500).send({ status: 'error', message: 'Fallo al inicializar el carrito. Error de base de datos.' });
        }
    } else {
        // Si el cartId ya existe y es válido, solo lo asignamos a locals para fácil acceso
        res.locals.cartId = cartId;
    }

    next();
};

export default initializeCart;
