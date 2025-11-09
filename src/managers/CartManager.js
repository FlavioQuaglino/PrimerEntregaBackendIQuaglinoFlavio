import CartModel from '../models/Cart.model.js';
import ProductModel from '../models/Product.model.js';
import mongoose from 'mongoose';

class CartManager {
  /** 🛒 Crear un carrito vacío */
  async createCart() {
    try {
      const newCart = await CartModel.create({ products: [] });
      return newCart;
    } catch (error) {
      console.error('❌ Error al crear el carrito:', error);
      throw new Error('No se pudo crear el carrito.');
    }
  }

  /** 🔍 Obtener un carrito por ID con populate */
  async getCartById(cartId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cartId)) return null;

      const cart = await CartModel.findById(cartId)
        .populate('products.product')
        .lean();

      return cart;
    } catch (error) {
      console.error('❌ Error al obtener el carrito:', error);
      throw new Error('No se pudo obtener el carrito.');
    }
  }

  /** ➕ Agregar producto al carrito */
  async addProductToCart(cartId, productId, quantity = 1) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(cartId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        throw new Error('ID de carrito o producto inválido.');
      }

      const cart = await CartModel.findById(cartId);
      if (!cart) throw new Error('Carrito no encontrado.');

      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Producto no encontrado.');

      const existingProduct = cart.products.find((p) =>
        p.product.equals(productId)
      );

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      await cart.save();
      return await cart.populate('products.product');
    } catch (error) {
      console.error('❌ Error al agregar producto al carrito:', error);
      throw new Error('No se pudo agregar el producto al carrito.');
    }
  }

  /** 🧺 Reemplazar todo el array de productos del carrito */
  async updateCartProducts(cartId, newProductsArray) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cartId)) return null;

      const cart = await CartModel.findById(cartId);
      if (!cart) return null;

      // Validar que todos los productos existan
      for (const item of newProductsArray) {
        const exists = await ProductModel.exists({ _id: item.product });
        if (!exists) throw new Error(`Producto ${item.product} no existe.`);
      }

      cart.products = newProductsArray;
      await cart.save();
      return await cart.populate('products.product');
    } catch (error) {
      console.error('❌ Error al actualizar carrito:', error);
      throw new Error('No se pudo actualizar el carrito.');
    }
  }

  /** 🔄 Actualizar solo la cantidad de un producto */
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(cartId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      )
        return null;

      const cart = await CartModel.findById(cartId);
      if (!cart) return null;

      const productInCart = cart.products.find((p) =>
        p.product.equals(productId)
      );
      if (!productInCart) return null;

      productInCart.quantity = quantity;
      await cart.save();
      return await cart.populate('products.product');
    } catch (error) {
      console.error('❌ Error al actualizar cantidad de producto:', error);
      throw new Error('No se pudo actualizar la cantidad del producto.');
    }
  }

  /** ❌ Eliminar un producto específico del carrito */
  async removeProductFromCart(cartId, productId) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(cartId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      )
        return null;

      const cart = await CartModel.findById(cartId);
      if (!cart) return null;

      cart.products = cart.products.filter(
        (p) => !p.product.equals(productId)
      );
      await cart.save();
      return await cart.populate('products.product');
    } catch (error) {
      console.error('❌ Error al eliminar producto del carrito:', error);
      throw new Error('No se pudo eliminar el producto del carrito.');
    }
  }

  /** 🗑️ Vaciar carrito completo */
  async clearCart(cartId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cartId)) return null;

      const cart = await CartModel.findById(cartId);
      if (!cart) return null;

      cart.products = [];
      await cart.save();
      return await cart.populate('products.product');
    } catch (error) {
      console.error('❌ Error al vaciar carrito:', error);
      throw new Error('No se pudo vaciar el carrito.');
    }
  }
}

export default new CartManager();
