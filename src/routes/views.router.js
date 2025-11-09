import { Router } from 'express';
import ProductModel from '../models/Product.model.js';
import CartModel from '../models/Cart.model.js';

const router = Router();

router.get('/products', async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      sort,
      query,      
      minPrice,
      maxPrice
    } = req.query;

    const filter = {};

    if (query) {
      if (query === 'available') {
        filter.stock = { $gt: 0 };
      } else {
        filter.category = query;
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOption =
      sort === 'asc'
        ? { price: 1 }
        : sort === 'desc'
        ? { price: -1 }
        : {};

    const products = await ProductModel.paginate(filter, {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sortOption,
      lean: true,
    });

    const baseUrl = '/products';
    const buildLink = (p) =>
      `${baseUrl}?limit=${limit}&page=${p}${
        sort ? `&sort=${sort}` : ''
      }${query ? `&query=${query}` : ''}${
        minPrice ? `&minPrice=${minPrice}` : ''
      }${maxPrice ? `&maxPrice=${maxPrice}` : ''}`;

    res.render('products', {
      title: 'Catálogo de Productos',
      products: products.docs,
      page: products.page,
      totalPages: products.totalPages,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage ? buildLink(products.prevPage) : null,
      nextLink: products.hasNextPage ? buildLink(products.nextPage) : null,
      query,
      sort,
      minPrice,
      maxPrice
    });
  } catch (error) {
    console.error('❌ Error al renderizar /products:', error);
    res.status(500).render('error', { message: 'Error al cargar productos.' });
  }
});

router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await ProductModel.find().lean();
    res.render('realTimeProducts', {
      title: 'Productos en Tiempo Real',
      products,
    });
  } catch (error) {
    console.error('❌ Error al renderizar /realtimeproducts:', error);
    res
      .status(500)
      .render('error', { message: 'Error al cargar vista en tiempo real.' });
  }
});

router.get('/carts/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    const cart = await CartModel.findById(cid)
      .populate('products.product')
      .lean();

    if (!cart) {
      return res.status(404).render('error', {
        message: `Carrito ${cid} no encontrado.`,
      });
    }

    const cartProducts = cart.products.map((item) => ({
      id: item.product._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
    }));

    const totalPrice = cartProducts.reduce((acc, p) => acc + p.total, 0);

    res.render('cart', {
      title: `Carrito ${cid}`,
      cartId: cid,
      products: cartProducts,
      hasProducts: cartProducts.length > 0,
      totalPrice,
    });
  } catch (error) {
    console.error('❌ Error al renderizar /carts/:cid:', error);
    res
      .status(500)
      .render('error', { message: 'Error al cargar carrito.' });
  }
});


router.get('/products/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const product = await ProductModel.findById(pid).lean();

    if (!product) {
      return res.status(404).render('error', { message: 'Producto no encontrado' });
    }

    res.render('productDetail', {
      title: product.title,
      product,
    });
  } catch (error) {
    console.error('❌ Error al renderizar /products/:pid:', error);
    res.status(500).render('error', { message: 'Error al cargar el producto.' });
  }
});

export default router;
