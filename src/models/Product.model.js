import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Esquema del producto
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    status: { type: Boolean, default: true },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    thumbnails: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Plugin de paginación
productSchema.plugin(mongoosePaginate);

// Evita OverwriteModelError en modo watch
const ProductModel =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default ProductModel;
