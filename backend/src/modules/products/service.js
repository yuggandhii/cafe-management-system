const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const listCategories = () => db('product_categories').where({ is_active: true }).orderBy('sequence');
const createCategory = async ({ name, color = '#E6F1FB', sequence = 99 }) => {
  const [row] = await db('product_categories').insert({ id: uuidv4(), name, color, sequence }).returning('*');
  return row;
};
const updateCategory = async (id, data) => {
  const [row] = await db('product_categories').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
  return row;
};
const deleteCategory = (id) => db('product_categories').where({ id }).update({ is_active: false });

const listProducts = async ({ search, category_id, is_active = true, page = 1, limit = 50 } = {}) => {
  let q = db('products as p')
    .join('product_categories as c', 'p.category_id', 'c.id')
    .select('p.*', 'c.name as category_name', 'c.color as category_color')
    .where('p.is_active', is_active)
    .orderBy('c.sequence').orderBy('p.name');
  if (search) q = q.whereILike('p.name', `%${search}%`);
  if (category_id) q = q.where('p.category_id', category_id);
  return q.limit(limit).offset((page - 1) * limit);
};

const getProductById = async (id) => {
  const product = await db('products as p')
    .join('product_categories as c', 'p.category_id', 'c.id')
    .select('p.*', 'c.name as category_name')
    .where('p.id', id).first();
  if (!product) return null;
  const variants = await db('product_variants').where({ product_id: id });
  return { ...product, variants };
};

const createProduct = async (data) => {
  const { variants, ...productData } = data;
  const [product] = await db('products').insert({ id: uuidv4(), ...productData }).returning('*');
  if (variants && variants.length > 0) {
    const varRows = variants.map(v => ({ id: uuidv4(), product_id: product.id, ...v }));
    await db('product_variants').insert(varRows);
  }
  const fullProduct = await getProductById(product.id);
  const io = require('../../app').io;
  if(io) io.emit('products_updated');
  return fullProduct;
};

const updateProduct = async (id, data) => {
  const { variants, ...productData } = data;
  await db('products').where({ id }).update({ ...productData, updated_at: new Date() });
  const fullProduct = await getProductById(id);
  const io = require('../../app').io;
  if(io) io.emit('products_updated');
  return fullProduct;
};

const toggleProduct = async (id) => {
  const p = await db('products').where({ id }).first();
  const [row] = await db('products').where({ id }).update({ is_active: !p.is_active }).returning('*');
  return row;
};

const addVariant = async (product_id, variantData) => {
  const [row] = await db('product_variants').insert({ id: uuidv4(), product_id, ...variantData }).returning('*');
  return row;
};

const removeVariant = (id) => db('product_variants').where({ id }).del();

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, listProducts, getProductById, createProduct, updateProduct, toggleProduct, addVariant, removeVariant };
