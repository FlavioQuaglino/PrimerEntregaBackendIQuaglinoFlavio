import ProductModel from '../models/Product.model.js';

class ProductManager {
  async getProducts(limit = 10, page = 1, sort = null, queryFilters = {}) {
    try {
      const query = {};

      if (queryFilters.category) query.category = queryFilters.category;
      if (queryFilters.available) {
        query.stock = queryFilters.available === 'true' ? { $gt: 0 } : { $lte: 0 };
      }
      if (queryFilters.searchTerm || queryFilters.query) {
        const term = queryFilters.searchTerm || queryFilters.query;
        const searchRegex = { $regex: term, $options: 'i' };
        query.$or = [{ title: searchRegex }, { description: searchRegex }];
      }

      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        lean: true,
      };

      if (sort === 'asc' || sort === 'desc') {
        options.sort = { price: sort === 'asc' ? 1 : -1 };
      }

      const result = await ProductModel.paginate(query, options);

      const baseUrl = '/products'; // ⚠️ importante: para las vistas, no la API
      const buildLink = (p) => {
        const params = new URLSearchParams({
          limit,
          page: p,
          ...(sort && { sort }),
          ...(queryFilters.category && { category: queryFilters.category }),
          ...(queryFilters.available && { available: queryFilters.available }),
          ...(queryFilters.query && { query: queryFilters.query }),
        });
        return `${baseUrl}?${params.toString()}`;
      };

      return {
        status: 'success',
        payload: result.docs || [],
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
        nextLink: result.hasNextPage ? buildLink(result.nextPage) : null,
        limit,
        sort,
        category: queryFilters.category || null,
        available: queryFilters.available || null,
        query: queryFilters.query || queryFilters.searchTerm || null
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Fallo en ProductManager.getProducts: ${error.message}`,
      };
    }
  }

  async getProductById(id) {
    return await ProductModel.findById(id).lean();
  }

  async addProduct(data) {
    return await ProductModel.create(data);
  }

  async updateProduct(id, data) {
    return await ProductModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async deleteProduct(id) {
    return await ProductModel.findByIdAndDelete(id).lean();
  }
}

export default new ProductManager();
