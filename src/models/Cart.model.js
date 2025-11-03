import mongoose from 'mongoose';

const cartProductSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products', // NECESARIO para el populate, apunta al ProductModel
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }
}, { _id: false }); // Usamos _id: false para que Mongoose no cree un ID para cada subdocumento

const cartSchema = new mongoose.Schema({
    products: {
        type: [cartProductSchema], // Array de los subdocumentos definidos arriba
        default: []
    }
});

// Implementamos el middleware pre-find para que cada vez que se haga un find (o findOne)
// se ejecute el populate de manera automática.
cartSchema.pre('findOne', function (next) {
    this.populate('products.product');
    next();
});

// 1. Crear el modelo de Mongoose
const CartModel = mongoose.model('carts', cartSchema);

// 2. Exportar el modelo de Mongoose
export default CartModel;