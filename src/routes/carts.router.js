import { Router } from 'express';
import CartManager from '../managers/CartManager.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const newCart = await CartManager.createCart();
    res.status(201).json({
      status: 'success',
      payload: newCart,
      message: 'Carrito creado exitosamente.',
    });
  } catch (error) {
    console.error('❌ Error al crear carrito:', error.message);
    res.status(500).json({ status: 'error', message: 'Error al crear carrito.' });
  }
});

router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await CartManager.getCartById(cid);

    if (!cart) {
      return res
        .status(404)
        .json({ status: 'error', message: `Carrito ${cid} no encontrado.` });
    }

    res.status(200).json({
      status: 'success',
      payload: cart.products || [],
    });
  } catch (error) {
    console.error('❌ Error al obtener carrito:', error.message);
    res
      .status(500)
      .json({ status: 'error', message: 'Error al obtener carrito.' });
  }
});

router.post('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'La cantidad debe ser un número positivo.',
      });
    }

    const updatedCart = await CartManager.addProductToCart(
      cid,
      pid,
      Number(quantity)
    );
    res.status(200).json({
      status: 'success',
      payload: updatedCart.products,
      message: 'Producto agregado al carrito.',
    });
  } catch (error) {
    console.error('❌ Error al agregar producto:', error.message);
    res
      .status(500)
      .json({ status: 'error', message: 'Error al agregar producto.' });
  }
});

router.put('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const productsArray = req.body; // [{ product: 'productId', quantity: N }, ...]

    if (!Array.isArray(productsArray)) {
      return res.status(400).json({
        status: 'error',
        message: 'Debe enviar un array de productos.',
      });
    }

    const updatedCart = await CartManager.updateCartProducts(
      cid,
      productsArray
    );

    if (!updatedCart) {
      return res
        .status(404)
        .json({ status: 'error', message: `Carrito ${cid} no encontrado.` });
    }

    res.status(200).json({
      status: 'success',
      payload: updatedCart.products,
      message: 'Carrito actualizado correctamente.',
    });
  } catch (error) {
    console.error('❌ Error al actualizar carrito:', error.message);
    res
      .status(500)
      .json({ status: 'error', message: 'Error al actualizar carrito.' });
  }
});

router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'La cantidad debe ser un número positivo.',
      });
    }

    const updatedCart = await CartManager.updateProductQuantity(
      cid,
      pid,
      quantity
    );

    if (!updatedCart) {
      return res.status(404).json({
        status: 'error',
        message: 'Carrito o producto no encontrado.',
      });
    }

    res.status(200).json({
      status: 'success',
      payload: updatedCart.products,
      message: `Cantidad del producto ${pid} actualizada.`,
    });
  } catch (error) {
    console.error('❌ Error al actualizar cantidad:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar cantidad en el carrito.',
    });
  }
});

router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const updatedCart = await CartManager.removeProductFromCart(cid, pid);

    if (!updatedCart) {
      return res.status(404).json({
        status: 'error',
        message: 'Carrito o producto no encontrado.',
      });
    }

    res.status(200).json({
      status: 'success',
      payload: updatedCart.products,
      message: 'Producto eliminado del carrito.',
    });
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error al eliminar producto del carrito.',
    });
  }
});

router.delete('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const clearedCart = await CartManager.clearCart(cid);

    if (!clearedCart) {
      return res
        .status(404)
        .json({ status: 'error', message: `Carrito ${cid} no encontrado.` });
    }

    res.status(200).json({
      status: 'success',
      payload: clearedCart.products,
      message: 'Carrito vaciado exitosamente.',
    });
  } catch (error) {
    console.error('❌ Error al vaciar carrito:', error.message);
    res
      .status(500)
      .json({ status: 'error', message: 'Error al vaciar carrito.' });
  }
});

export default router;
