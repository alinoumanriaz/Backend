
import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';
import env from "dotenv";
import { revalidateFrontend } from "../helper/revalidatefrontend.js";
import { getRedisClient } from "../client.js";

env.config()

const addProduct = async (req, res) => {

    const { name, slug, description, gender, category, status, fabric, variation, originalProductLink, clothType } = req.body
    console.log({variation:variation})

    // Validation (keep this part the same)
    if (name === '' || slug === '' || gender === '' || fabric === '' || originalProductLink === '' || clothType === '') {
        return res.status(400).json({ message: 'Please enter product data' }); // Changed to 400 for bad request
    }
    if (!category) {
        return res.status(400).json({ message: 'Please select category' });
    }

    let connection;
    try {
        // Get a connection from the pool
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insert main product
        const [addedProduct] = await connection.query(
            `INSERT INTO products (name, slug, description, status, gender, fabricId, originalProductLink, clothType) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, slug, description, status, gender, fabric, originalProductLink, clothType]
        );
        const productId = addedProduct.insertId;

        // 2. Insert categories in parallel
        const categoryList = Array.isArray(category) ? category : [category];
        const categories = categoryList.map(item => parseInt(item, 10));

        if (categories.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Category field is required' });
        }

        await Promise.all(
            categories.map(item =>
                connection.query(
                    'INSERT INTO products_categories (productId, categoryId) VALUES (?, ?)',
                    [productId, item]
                )
            )
        );

        // 3. Process variants and images in parallel
        const variantPromises = variation.map(async (variant, index) => {
            // Insert variant
            const [variantResult] = await connection.query(
                `INSERT INTO product_variants (productId, colorName, colorCode, price, salePrice, stock, sizes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    variant.colorName,
                    variant.colorCode,
                    variant.price,
                    variant.salePrice || null,
                    variant.stock,
                    JSON.stringify(variant.sizes),
                ]
            );
            const variantId = variantResult.insertId;
            console.log({varientID:variantId})

            // Process images for this variant
            const mainImage = Array.isArray(variant.image) ? variant.image[0] : variant.image; // Ensure single image handling
            const galleryImages = variant.gallery || [];
            console.log({mainImage:variant.image})
            console.log({galleryImages:variant.gallery})

            const imagePromises = [];

            // If mainImage is provided, insert it into the database
            if (mainImage) {
                imagePromises.push(
                    connection.query(
                        `INSERT INTO product_images (productId, variantId, imageUrl, isMain) 
                        VALUES (?, ?, ?, ?)`,
                        [productId, variantId, mainImage, 1]
                    )
                );
            }

            // Insert gallery images into the database
            if (galleryImages.length > 0) {
                galleryImages.forEach(img => {
                    imagePromises.push(
                        connection.query(
                            `INSERT INTO product_images (productId, variantId, imageUrl, isMain) 
                            VALUES (?, ?, ?, ?)`,
                            [productId, variantId, img, 0]
                        )
                    );
                });
            }


            // Wait for all image uploads
            await Promise.all(imagePromises);

        });

        await Promise.all(variantPromises);


        const [fabricRows] = await connection.query(`SELECT slug FROM fabric WHERE id=?`, [fabric])

        const [categoryRows] = await connection.query(
            `SELECT slug FROM categories WHERE id IN (${categories.map(() => '?').join(',')})`,
            categories
        );

        const client = await getRedisClient();
        await client.del('allProducts')
        // categoryRows now looks like: [ { slug: 'men' }, { slug: 'shoes' }, ... ]

        const categorySlugs = categoryRows.map(row => row.slug);

        // 3. Now you can use categorySlugs for revalidate
        const pathsToRevalidate = [
            '/shop',
            `/women`,
            `/men`,
            `/eidsale`,
            `/newarrival`,
            `/shop/${slug}`,
            `/shop/fabric/${fabricRows[0].slug}`,
            ...categorySlugs.map(slug => `/shop/${slug}`)
        ];

        // 4. Revalidate all paths
        await revalidateFrontend(pathsToRevalidate);


        await connection.commit();
        return res.status(200).json({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Product addition error:', error);
        if (connection) await connection.rollback();
        return res.status(500).json({ message: 'Error adding product' });
    } finally {
        if (connection) connection.release();
    }
}

const getAllProducts = async (req, res) => {
    try {
        const cacheKey = 'allProducts';
        const client = await getRedisClient();

        // 1️⃣ Check Redis cache first
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            console.log('✅ Returning product list from Redis');
            return res.status(200).json({ message: 'all products list', allProducts: JSON.parse(cachedData) });
        }

        // 2️⃣ Fetch all products with fabric info
        const [products] = await db.query(`
            SELECT p.*, f.name AS fabricName, f.slug AS fabricSlug
            FROM products p
            JOIN fabric f ON p.fabricId = f.id
        `);

        const productList = [];

        // 3️⃣ Loop through products and get additional details
        for (const product of products) {
            const productId = product.id;

            // Get categories for each product
            const [categoryRows] = await db.query(`
                SELECT c.id, c.name, c.slug
                FROM products_categories pc
                JOIN categories c ON pc.categoryId = c.id
                WHERE pc.productId = ?
            `, [productId]);

            // Get variations for each product
            const [variants] = await db.query(`
                SELECT * FROM product_variants WHERE productId = ?
            `, [productId]);

            // Get images (main + gallery) for each product
            const [images] = await db.query(`
                SELECT * FROM product_images WHERE productId = ?
            `, [productId]);

            // Attach images to the relevant variant
            const enrichedVariants = variants.map(variant => {
                const variantImages = images.filter(img => img.variantId === variant.variantId);
                return {
                    ...variant,
                    mainImage: variantImages.find(img => img.isMain === 1) || null,
                    gallery: variantImages.filter(img => img.isMain === 0)
                };
            });

            // Add enriched product data to productList
            productList.push({
                ...product,
                categories: categoryRows,
                variations: enrichedVariants
            });
        }

        // 4️⃣ Save the product list to Redis with an expiration of 1 hour (3600 seconds)
        await client.set(cacheKey, JSON.stringify(productList));

        // 5️⃣ Send the response with all product data
        return res.status(200).json({ message: 'all products list', allProducts: productList });

    } catch (error) {
        console.error('Error fetching products:', error);
        // Redis error handling
        // if (error.message.includes('redis')) {
        //     return res.status(500).json({ message: 'Failed to connect to Redis, fallback to DB' });
        // }

        return res.status(500).json({ message: 'Error fetching products' });
    }
};


const singleProduct = async (req, res) => {
    const slug = req.params.slug
    console.log({productapislug:slug})
    try {
        const [productResult] = await db.query(`SELECT 
            p.id AS id,
            p.name AS name,
            p.slug AS slug,
            p.description AS description,
            p.gender AS gender,
            f.name AS fabricName,
            f.slug AS fabricSlug
            FROM products p
            JOIN fabric f ON p.fabricId= f.id
            WHERE p.slug=?`, [slug])

        if (!productResult) {
            return res.status(500).json({ message: 'single product not found' })
        } else {
            const productId = productResult[0].id
            const productData = productResult[0]
            const [variations] = await db.query(`SELECT
                pv.variantId AS variantId,
                pv.colorName AS colorName,
                pv.colorCode AS colorCode,
                pv.sizes AS sizes,
                pv.price,
                pv.salePrice,
                pv.stock
                FROM product_variants pv
                WHERE pv.productId=?`, [productId])

            const [categoryRows] = await db.query(`
                    SELECT c.id, c.name, c.slug
                    FROM products_categories pc
                    JOIN categories c ON pc.categoryId = c.id
                    WHERE pc.productId = ?
                  `, [productId]);

            const [images] = await db.query(`
                    SELECT variantId, imageUrl, isMain
                    FROM product_images
                    WHERE variantId IN (?)
                  `, [variations.map(v => v.variantId)])

            const allVariations = variations.map(variant => {
                const variantImages = images.filter(img => img.variantId === variant.variantId)
                const mainImage = variantImages.find(img => img.isMain)
                const gallery = variantImages.filter(img => !img.isMain)

                return {
                    ...variant,
                    mainImage: mainImage?.imageUrl,
                    gallery: gallery.map(g => g.imageUrl)
                }
            })


            const singleProductData = {
                ...productData,
                categories: categoryRows,
                allVariations
            }
            return res.status(200).json({ message: 'fetching single Product Data', singleProductData: singleProductData })
        }
    } catch (error) {
        console.error('single product api error', error)
        return res.status(500).json({ message: 'single product api error' })
    }
}


const deleteProduct = async (req, res) => {
    const { id, fabric, categories, slug } = req.body
    let connection;

    try {
        // Get a database connection and start transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. First get all image URLs associated with this product
        const [images] = await connection.query(
            `SELECT imageUrl FROM product_images WHERE productId = ?`,
            [id]
        );

        // 2. Delete images from Cloudinary in parallel
        const deletePromises = images.map(async (image) => {
            // Extract public_id from Cloudinary URL
            // Cloudinary URLs typically look like: 
            // https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<public_id>.<format>
            const urlParts = image.imageUrl.split('/');
            const publicIdWithExtension = urlParts.slice(-2).join('/').split('.')[0];
            const publicId = `Gallery/${publicIdWithExtension}`;

            try {
                return await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.error(`Failed to delete image ${publicId}:`, error);
            }
        });

        await Promise.all(deletePromises);
        // 3. Delete all related records from database tables
        // Order matters - delete child records first
        await connection.query(`DELETE FROM product_images WHERE productId = ?`, [id]);
        await connection.query(`DELETE FROM product_variants WHERE productId = ?`, [id]);
        await connection.query(`DELETE FROM products_categories WHERE productId = ?`, [id]);
        await connection.query(`DELETE FROM products WHERE id = ?`, [id]);

        // Commit transaction if all operations succeeded
        await connection.commit();

        const categorySlug = categories?.map((item) => item.slug)
        const pathsToRevalidate = [
            '/shop',
            `/women`,
            `/men`,
            `/eidsale`,
            `/newarrival`,
            `/shop/${slug}`,
            `/shop/fabric/${fabric}`,
            ...categorySlug.map(slug => `/shop/${slug}`)
        ];

        // 4. Revalidate all paths
        await revalidateFrontend(pathsToRevalidate);

        res.status(200).json({ message: 'Product and all associated images deleted successfully' });
    } catch (error) {
        console.error('Product deletion error:', error);

        // Rollback transaction if any error occurred
        if (connection) await connection.rollback();

        res.status(500).json({
            message: 'Failed to delete product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // Release the connection back to the pool
        if (connection) connection.release();
    }
};

const editProduct = async (req, res) => {

    const { id } = req.params
    try {
        const [productResult] = await db.query(`SELECT 
            p.id AS id,
            p.name AS name,
            p.slug AS slug,
            p.description AS description,
            p.gender AS gender,
            f.id AS fabric,
            p.originalProductLink AS originalProductLink,
            p.clothType AS clothType
            FROM products p
            JOIN fabric f ON p.fabricId= f.id
            WHERE p.id=?`, [id])

        if (!productResult) {
            return res.status(500).json({ message: 'single product not found' })
        } else {
            const productId = productResult[0].id
            const productData = productResult[0]
            const [variations] = await db.query(`SELECT
                pv.variantId AS variantId,
                pv.colorName AS colorName,
                pv.colorCode AS colorCode,
                pv.sizes AS sizes,
                pv.price,
                pv.salePrice,
                pv.stock
                FROM product_variants pv
                WHERE pv.productId=?`, [productId])

            const [categoryRows] = await db.query(`
                    SELECT c.id
                    FROM products_categories pc
                    JOIN categories c ON pc.categoryId = c.id
                    WHERE pc.productId = ?
                  `, [productId]);

            const [images] = await db.query(`
                    SELECT variantId, imageUrl, isMain
                    FROM product_images
                    WHERE variantId IN (?)
                  `, [variations.map(v => v.variantId)])

            const variation = variations.map(variant => {
                const variantImages = images.filter(img => img.variantId === variant.variantId)
                const mainImage = variantImages.find(img => img.isMain)
                const gallery = variantImages.filter(img => !img.isMain)

                return {
                    ...variant,
                    image: mainImage?.imageUrl,
                    gallery: gallery.map(g => g.imageUrl)
                }
            })

            const singleProductData = {
                ...productData,
                categories: categoryRows,
                variation
            }
            return res.status(200).json({ singleProductData: singleProductData })
        }
    }
    catch (error) {
        console.log('edit api not working', error)
    }
}


export const controller = {
    addProduct,
    getAllProducts,
    singleProduct,
    deleteProduct,
    editProduct
}