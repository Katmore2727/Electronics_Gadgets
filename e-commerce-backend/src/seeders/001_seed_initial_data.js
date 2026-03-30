import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import config from '../config/index.js';
import { generateAndStoreEmbedding } from '../services/productEmbeddingService.js';

/**
 * Simple slugify implementation (matches productService behavior).
 */
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Ensure a unique product slug (appends suffix if needed).
 */
const ensureUniqueProductSlug = async (client, clientId, baseSlug) => {
  let slug = baseSlug;
  let suffix = 0;

  while (true) {
    const { rows } = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (rows.length === 0) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

/**
 * Insert or update category, return category id.
 */
const upsertCategory = async (client, category) => {
  const { name, slug, description, image_url, sort_order, parent_id } = category;
  const result = await client.query(
    `INSERT INTO categories (name, slug, description, image_url, sort_order, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (slug)
     DO UPDATE SET name = EXCLUDED.name,
                   description = EXCLUDED.description,
                   image_url = EXCLUDED.image_url,
                   sort_order = EXCLUDED.sort_order,
                   parent_id = EXCLUDED.parent_id
     RETURNING id`,
    [name, slug, description ?? null, image_url ?? null, sort_order ?? 0, parent_id ?? null]
  );
  return result.rows[0].id;
};

/**
 * Insert or update product, return product id.
 */
const ensureProduct = async (client, product) => {
  const {
    name,
    description,
    price,
    stockQuantity,
    categoryId,
    sku,
    brand,
    images,
    specifications,
  } = product;

  const slug = slugify(name);

  const result = await client.query(
    `INSERT INTO products (
      name, slug, description, price, stock_quantity, category_id, sku, brand,
      images, specifications, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
    ON CONFLICT (sku)
    DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      stock_quantity = EXCLUDED.stock_quantity,
      category_id = EXCLUDED.category_id,
      brand = EXCLUDED.brand,
      images = EXCLUDED.images,
      specifications = EXCLUDED.specifications,
      updated_at = NOW()
    RETURNING id, name`,
    [
      name,
      slug,
      description,
      price,
      stockQuantity,
      categoryId,
      sku,
      brand,
      JSON.stringify(images),
      JSON.stringify(specifications || {}),
    ]
  );

  return result.rows[0];
};

/**
 * Main seeding function.
 */
const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1) Categories
    const categories = [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Latest smartphones and mobile devices',
        image_url: 'https://placehold.co/1200x800/4A90E2/FFFFFF?text=Smartphones',
        sort_order: 1,
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'High-performance laptops and notebooks',
        image_url: 'https://placehold.co/1200x800/50C878/FFFFFF?text=Laptops',
        sort_order: 2,
      },
      {
        name: 'Tablets',
        slug: 'tablets',
        description: 'Tablets and 2-in-1 devices',
        image_url: 'https://placehold.co/1200x800/FF6B6B/FFFFFF?text=Tablets',
        sort_order: 3,
      },
      {
        name: 'Audio',
        slug: 'audio',
        description: 'Headphones, speakers and audio gear',
        image_url: 'https://placehold.co/1200x800/9B59B6/FFFFFF?text=Audio',
        sort_order: 4,
      },
      {
        name: 'Wearables',
        slug: 'wearables',
        description: 'Smartwatches and fitness trackers',
        image_url: 'https://placehold.co/1200x800/F39C12/FFFFFF?text=Wearables',
        sort_order: 5,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Cables, chargers, cases and more',
        image_url: 'https://placehold.co/1200x800/95A5A6/FFFFFF?text=Accessories',
        sort_order: 6,
      },
    ];

    const categoryIdMap = {};
    for (const cat of categories) {
      const id = await upsertCategory(client, cat);
      categoryIdMap[cat.slug] = id;
    }

    // 2) Products
    const products = [
      {
        name: 'Galaxy Pro X1 Smartphone',
        description:
          'Experience the next generation of mobile performance with a 120Hz display, 108MP camera, and 5000mAh battery.',
        price: 39999.0,
        stockQuantity: 35,
        categorySlug: 'smartphones',
        sku: 'GPX1-001',
        brand: 'GalaxyPro',
        images: [
          '/product-images/galaxy-pro-x1-smartphone.svg',
        ],
        specifications: {
          'Display': '6.7" 120Hz AMOLED',
          'Processor': 'Snapdragon 8 Gen 3',
          'RAM': '12GB',
          'Storage': '256GB',
          'Camera': '108MP Triple',
          'Battery': '5000mAh',
        },
      },
      {
        name: 'ZenBook Air 14 Laptop',
        description:
          'Ultra-thin laptop with Intel i7, 16GB RAM, 512GB SSD and OLED display for creators and professionals.',
        price: 79999.0,
        stockQuantity: 22,
        categorySlug: 'laptops',
        sku: 'ZBA14-2026',
        brand: 'ZenTech',
        images: [
          '/product-images/zenbook-air-14-laptop.svg',
        ],
        specifications: {
          'Processor': 'Intel Core i7-13700H',
          'RAM': '16GB DDR5',
          'Storage': '512GB SSD',
          'Display': '14" 2.8K OLED',
          'Graphics': 'Intel Iris Xe',
          'Weight': '1.2kg',
        },
      },
      {
        name: 'NoisePro ANC Headphones',
        description:
          'Wireless over-ear headphones with active noise cancellation, 30h battery life and premium sound.',
        price: 12999.0,
        stockQuantity: 50,
        categorySlug: 'audio',
        sku: 'NP-ANC-220',
        brand: 'NoisePro',
        images: [
          '/product-images/noisepro-anc-headphones.svg',
        ],
        specifications: {
          'Driver': '40mm Dynamic',
          'Battery': '30h ANC On',
          'Connectivity': 'Bluetooth 5.2',
          'ANC': 'Yes',
          'Weight': '290g',
        },
      },
      {
        name: 'FitTrack Smartwatch',
        description:
          'Fitness smartwatch with heart rate monitoring, GPS, and sleep tracking.',
        price: 8999.0,
        stockQuantity: 60,
        categorySlug: 'wearables',
        sku: 'FT-SW-550',
        brand: 'FitTrack',
        images: [
          '/product-images/fittrack-smartwatch.svg',
        ],
        specifications: {
          'Display': '1.4" AMOLED',
          'Battery': '7 days',
          'Sensors': 'Heart Rate, GPS',
          'Water Resistance': '5ATM',
          'Compatibility': 'iOS/Android',
        },
      },
      {
        name: 'RapidCharge 65W USB-C Charger',
        description:
          'Compact GaN charger with 65W PD output, perfect for laptops and phones.',
        price: 2499.0,
        stockQuantity: 85,
        categorySlug: 'accessories',
        sku: 'RC65W-001',
        brand: 'ChargeX',
        images: [
          '/product-images/rapidcharge-65w-usb-c-charger.svg',
        ],
        specifications: {
          'Output': '65W USB-C PD',
          'Input': '100-240V',
          'Technology': 'GaN',
          'Size': 'Compact',
          'Compatibility': 'Universal',
        },
      },
      {
        name: 'PixelStream 4K Streaming Stick',
        description:
          'Plug-and-play 4K HDR streaming stick with voice remote and Dolby Atmos support.',
        price: 5999.0,
        stockQuantity: 41,
        categorySlug: 'accessories',
        sku: 'PS-4K-2026',
        brand: 'PixelStream',
        images: [
          '/product-images/pixelstream-4k-streaming-stick.svg',
        ],
        specifications: {
          'Resolution': '4K HDR',
          'Audio': 'Dolby Atmos',
          'Remote': 'Voice Control',
          'OS': 'Android TV',
          'Connectivity': 'WiFi 6',
        },
      },
      {
        name: 'Aura Wireless Charging Pad',
        description:
          'Fast wireless charger with temperature control and multi-device support.',
        price: 2299.0,
        stockQuantity: 70,
        categorySlug: 'accessories',
        sku: 'AURA-WC-01',
        brand: 'AuraTech',
        images: [
          '/product-images/aura-wireless-charging-pad.svg',
        ],
        specifications: {
          'Output': '15W Wireless',
          'Charging': 'Fast Charge',
          'Temperature Control': 'Yes',
          'Multi-Device': 'Yes',
          'Compatibility': 'Qi Standard',
        },
      },
      {
        name: 'SmartSound True Wireless Earbuds',
        description:
          'True wireless earbuds with ambient mode, 25h total battery life, and voice assistant support.',
        price: 4999.0,
        stockQuantity: 55,
        categorySlug: 'audio',
        sku: 'SSTW-700',
        brand: 'SmartSound',
        images: [
          '/product-images/smartsound-true-wireless-earbuds.svg',
        ],
        specifications: {
          'Driver': '13mm Dynamic',
          'Battery': '25h Total',
          'ANC': 'Yes',
          'Water Resistance': 'IPX4',
          'Voice Assistant': 'Yes',
        },
      },
      {
        name: 'ProCam 4K Action Camera',
        description:
          'Waterproof 4K action camera with image stabilization and wide-angle lens.',
        price: 12999.0,
        stockQuantity: 30,
        categorySlug: 'accessories',
        sku: 'PC-4K-AC',
        brand: 'ProCam',
        images: [
          '/product-images/procam-4k-action-camera.svg',
        ],
        specifications: {
          'Resolution': '4K 60fps',
          'Waterproof': '30m',
          'Stabilization': 'EIS',
          'Lens': 'Wide Angle',
          'Battery': '1400mAh',
        },
      },
      {
        name: 'NanoSound Bluetooth Speaker',
        description:
          'Portable Bluetooth speaker with deep bass, 20h playtime and IPX7 water resistance.',
        price: 3499.0,
        stockQuantity: 45,
        categorySlug: 'audio',
        sku: 'NS-BT-101',
        brand: 'NanoSound',
        images: [
          '/product-images/nanosound-bluetooth-speaker.svg',
        ],
        specifications: {
          'Driver': '52mm Woofer',
          'Battery': '20h Playtime',
          'Water Resistance': 'IPX7',
          'Connectivity': 'Bluetooth 5.0',
          'Weight': '500g',
        },
      },
      {
        name: 'EcoCharge Solar Power Bank 20000mAh',
        description:
          'High-capacity power bank with solar charging and dual USB output.',
        price: 2999.0,
        stockQuantity: 40,
        categorySlug: 'accessories',
        sku: 'EC-20000',
        brand: 'EcoCharge',
        images: [
          '/product-images/ecocharge-solar-power-bank.svg',
        ],
        specifications: {
          'Capacity': '20000mAh',
          'Solar Charging': 'Yes',
          'Outputs': '2x USB',
          'Input': 'Solar/Micro USB',
          'Weight': '350g',
        },
      },
      {
        name: 'VibeFit Smart Scale',
        description:
          'Bluetooth smart scale with body composition metrics and app insights.',
        price: 2599.0,
        stockQuantity: 28,
        categorySlug: 'wearables',
        sku: 'VF-SS-009',
        brand: 'VibeFit',
        images: [
          '/product-images/vibefit-smart-scale.svg',
        ],
        specifications: {
          'Measurements': 'Weight, BMI, Body Fat',
          'Connectivity': 'Bluetooth',
          'App': 'iOS/Android',
          'Users': '8 Users',
          'Power': '4x AAA Batteries',
        },
      },
    ];

    for (const prod of products) {
      const categoryId = categoryIdMap[prod.categorySlug];
      if (!categoryId) {
        throw new Error(`Unknown category slug: ${prod.categorySlug}`);
      }

      const product = await ensureProduct(client, {
        ...prod,
        categoryId,
      });

      // Generate and store embedding for recommendation engine (safe even if OPENAI_API_KEY not set)
      await generateAndStoreEmbedding(product);
    }

    // 3) Admin user
    const adminEmail = 'admin@electroshop.com';
    const adminPassword = 'admin123';

    // Check if admin exists
    const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [adminEmail, hashedPassword, 'Admin', 'User', 'admin', true]
      );

      console.log('Admin user created successfully');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Admin user already exists');
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding
seedDatabase()
  .then(() => {
    console.log('Seeding complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
