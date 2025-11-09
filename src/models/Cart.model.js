import mongoose from 'mongoose';

// Esquema para cada ítem del carrito
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',   // Debe coincidir con el modelo Product
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false } // no genera _id para cada ítem
);

// Esquema principal del carrito
const cartSchema = new mongoose.Schema(
  {
    products: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Evita OverwriteModelError en modo watch
const CartModel =
  mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default CartModel;
