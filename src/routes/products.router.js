import { Router } from 'express';
import productManager from '../managers/ProductManager.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      sort,
      query, 
    } = req.query;

    const queryFilters = {};

    if (query) {
      if (query === 'available') {
        queryFilters.available = 'true';
      } else {
        queryFilters.category = query;
      }
    }

    const result = await productManager.getProducts(limit, page, sort, queryFilters);

    if (result.status === 'error') {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en GET /api/products:', error);
    return res.status(500).json({
      status: 'error',
      payload: [],
      totalPages: 0,
      prevPage: null,
      nextPage: null,
      page: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevLink: null,
      nextLink: null,
      message: error.message,
    });
  }
});

router.get('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const product = await productManager.getProductById(pid);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: `Producto con ID ${pid} no encontrado.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: product,
    });
  } catch (error) {
    console.error('❌ Error en GET /api/products/:pid:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener el producto.',
      details: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    return res.status(201).json({
      status: 'success',
      payload: newProduct,
      message: 'Producto creado exitosamente.',
    });
  } catch (error) {
    console.error('❌ Error en POST /api/products:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Error al crear el producto.',
      details: error.message,
    });
  }
});

router.put('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const updated = await productManager.updateProduct(pid, req.body);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: `Producto con ID ${pid} no encontrado.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: updated,
      message: 'Producto actualizado correctamente.',
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/products/:pid:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Error al actualizar el producto.',
      details: error.message,
    });
  }
});

router.delete('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const deleted = await productManager.deleteProduct(pid);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: `Producto con ID ${pid} no encontrado.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: deleted,
      message: 'Producto eliminado correctamente.',
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/products/:pid:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al eliminar el producto.',
      details: error.message,
    });
  }
});

export default router;
