import 'dotenv/config';
import pool from '../src/config/database.js';

const categories = [
  { name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones and accessories', sort_order: 1 },
  { name: 'Laptops', slug: 'laptops', description: 'Laptops and notebooks', sort_order: 2 },
  { name: 'Tablets', slug: 'tablets', description: 'Tablets and e-readers', sort_order: 3 },
  { name: 'Accessories', slug: 'accessories', description: 'Cables, cases, and more', sort_order: 4 },
];

async function seed() {
  for (const cat of categories) {
    await pool.query(
      `INSERT INTO categories (name, slug, description, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING`,
      [cat.name, cat.slug, cat.description, cat.sort_order]
    );
  }
  console.log('Categories seeded');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
