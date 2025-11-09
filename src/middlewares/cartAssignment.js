import CartManager from '../managers/CartManager.js';
import mongoose from 'mongoose';

/**
 * 
 * 
 * @param {object} req - 
 * @param {object} res - 
 * @param {function} next - 
 */
const initializeCart = async (req, res, next) => {

    let cartId = req.session.cartId;

    if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
        console.log("No hay cartId en sesión o es inválido. Creando nuevo carrito...");
        try {
            const newCart = await CartManager.createCart();
            
            req.session.cartId = newCart._id.toString();
            console.log(`Nuevo carrito creado y asignado a sesión: ${req.session.cartId}`);

            res.locals.cartId = req.session.cartId;
            
        } catch (error) {
            console.error('ERROR en el middleware initializeCart:', error.message);
            return res.status(500).send({ status: 'error', message: 'Fallo al inicializar el carrito. Error de base de datos.' });
        }
    } else {
        res.locals.cartId = cartId;
    }

    next();
};

export default initializeCart;
