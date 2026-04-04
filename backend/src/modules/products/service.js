const db = require('../../db');

const list = async ({ search, category_id, is_active, page = 1, limit = 50 } = {}) => {
  const query = db('products')
    .select(
      'products.*',
      'product_categories.name as category_name',
      'product_categories.color as category_color'
    )
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .orderBy('products.name', 'asc');

  if (search) query.whereIlike('products.name', `%${search}%`);
  if (category_id) query.where('products.category_id', category_id);
  if (is_active !== undefined) query.where('products.is_active', is_active === 'true' || is_active === true);

  const offset = (page - 1) * limit;
  query.limit(limit).offset(offset);

  return query;
};

const getById = async (id) => {
  const product = await db('products')
    .select('products.*', 'product_categories.name as category_name')
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .where('products.id', id)
    .first();
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  const variants = await db('product_variants').where({ product_id: id });
  return { ...product, variants };
};

const create = async ({ name, category_id, price, tax_percent = 0, unit_of_measure = 'Unit', description }) => {
  const [product] = await db('products')
    .insert({ name, category_id, price, tax_percent, unit_of_measure, description })
    .returning('*');
  return product;
};

const update = async (id, { name, category_id, price, tax_percent, unit_of_measure, description }) => {
  const [product] = await db('products')
    .where({ id })
    .update({ name, category_id, price, tax_percent, unit_of_measure, description, updated_at: db.fn.now() })
    .returning('*');
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const toggleActive = async (id) => {
  const product = await db('products').where({ id }).first();
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  const [updated] = await db('products')
    .where({ id })
    .update({ is_active: !product.is_active, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

const addVariant = async (product_id, { attribute_name, value, unit, extra_price = 0 }) => {
  const [variant] = await db('product_variants')
    .insert({ product_id, attribute_name, value, unit, extra_price })
    .returning('*');
  return variant;
};

const removeVariant = async (variant_id) => {
  const deleted = await db('product_variants').where({ id: variant_id }).delete();
  if (!deleted) {
    const err = new Error('Variant not found');
    err.statusCode = 404;
    throw err;
  }
};

module.exports = { list, getById, create, update, toggleActive, addVariant, removeVariant };
