const db = require('../../db');

const getAll = (filters = {}) => {
  let q = db('products')
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .select('products.*', 'product_categories.name as category_name', 'product_categories.color as category_color')
    .orderBy(['products.sequence', 'products.name']);

  if (filters.category_id) q = q.where('products.category_id', filters.category_id);
  if (filters.is_active !== undefined) q = q.where('products.is_active', filters.is_active);
  return q;
};

const getById = (id) =>
  db('products')
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .select('products.*', 'product_categories.name as category_name')
    .where('products.id', id)
    .first();

const getVariants = (product_id) => db('product_variants').where({ product_id });

const getWithVariants = async (id) => {
  const product = await getById(id);
  if (!product) return null;
  const variants = await getVariants(id);
  return { ...product, variants };
};

const sanitize = (data) => ({
  ...data,
  category_id: data.category_id || null,
});

const create = async (data) => {
  const { variants, ...productData } = sanitize(data);
  return db.transaction(async (trx) => {
    const [product] = await trx('products').insert(productData).returning('*');
    if (variants && variants.length > 0) {
      await trx('product_variants').insert(
        variants.map((v) => ({ ...v, product_id: product.id }))
      );
    }
    return product;
  });
};

const update = async (id, data) => {
  const { variants, ...productData } = sanitize(data);
  return db.transaction(async (trx) => {
    const [product] = await trx('products')
      .where({ id })
      .update({ ...productData, updated_at: new Date() })
      .returning('*');

    if (variants !== undefined) {
      await trx('product_variants').where({ product_id: id }).del();
      if (variants.length > 0) {
        await trx('product_variants').insert(
          variants.map((v) => ({ ...v, product_id: id }))
        );
      }
    }
    return product;
  });
};

const remove = (id) => db('products').where({ id }).del();

module.exports = { getAll, getById, getVariants, getWithVariants, create, update, remove };
