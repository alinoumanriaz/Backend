import { clearScreenDown } from "readline";
import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addProduct = async (req, res) => {
    const { name, slug, description, gender, category, status, fabric, variation } = req.body
    if (name === '' || slug === '' || gender === '' || fabric === '') {
        return res.status(500).json({ message: 'Please enter product data' });
    }
    if (!category) {
        return res.status(500).json({ message: 'Please select category' });
    }
    try {
        const [addedProduct] = await db.query(`INSERT INTO products (name, slug, description, status, gender, fabricId) VALUES (?, ?, ?, ?, ?, ?)`, [name, slug, description, status, gender, fabric]);
        const productId = addedProduct.insertId

        // insert category data
        const categoryList = Array.isArray(category) ? category : [category]
        const categories = categoryList.map((item) => parseInt(item, 10))
        if (categories.length === 0) {
            return res.status(500).json({ message: 'Category field is required' });
        }
        categories.map(async (item) => {
            await db.query('INSERT INTO products_categories (productId, categoryId) VALUES (?, ?)', [productId, item])
        })

        // 3. Insert variations
        let imageIndex = 0;
        for (const varient of variation) {
            const [variantResult] = await db.query(`INSERT INTO product_variants (productId, colorName, colorCode, price, salePrice, stock, sizes) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                productId,
                varient.colorName,
                varient.colorCode,
                varient.price,
                varient.salePrice || null,
                varient.stock,
                JSON.stringify(varient.sizes),
            ]
            );

            const variantId = variantResult.insertId;

            // 4. Add main image
            // Upload main image to Cloudinary
            const mainImage = req.files.find(f => f.fieldname === `image[${imageIndex}]`);;
            if (mainImage) {
                const uploadedMainImage = await cloudinary.uploader.upload(mainImage.path, { folder: 'product_images' });
                await db.query(
                    `INSERT INTO product_images (productId, variantId, imageUrl, altText, isMain) VALUES (?, ?, ?, ?, ?)`,
                    [productId, variantId, uploadedMainImage.secure_url, uploadedMainImage.original_filename, 1]
                );
            }

            // 5. Add gallery images
            const galleryImages = req.files.filter(f => f.fieldname === `gallery[${imageIndex}]`);
            for (const img of galleryImages) {
                const uploadedMainImage = await cloudinary.uploader.upload(img.path, { folder: 'product_images' });
                await db.query(
                    `INSERT INTO product_images (productId, variantId, imageUrl, altText, isMain) VALUES (?, ?, ?, ?, ?)`,
                    [productId, variantId, uploadedMainImage.secure_url, uploadedMainImage.original_filename, 0]
                );
            }
            imageIndex++;
        }
        return res.status(200).json({ message: 'Product added successfully' });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'product adding error' })
    }
}

const getAllProducts = async (req, res) => {
    try {
        // 1. Get all products
        const [products] = await db.query('SELECT p.*, f.name AS fabricName FROM products p JOIN fabric f ON p.fabricId= f.id');

        const productList = [];

        for (const product of products) {
            const productId = product.id;

            // 2. Get categories
            const [categoryRows] = await db.query(`
            SELECT c.id, c.name, c.slug
            FROM products_categories pc
            JOIN categories c ON pc.categoryId = c.id
            WHERE pc.productId = ?
          `, [productId]);

            // 3. Get variations
            const [variants] = await db.query(`
            SELECT * FROM product_variants WHERE productId = ?
          `, [productId]);

            // 4. Get images (main + gallery)
            const [images] = await db.query(`
            SELECT * FROM product_images WHERE productId = ?
          `, [productId]);

            // 5. Attach images to the relevant variant
            const enrichedVariants = variants.map(variant => {
                const variantImages = images.filter(img => img.variantId === variant.variantId);
                return {
                    ...variant,
                    mainImage: variantImages.find(img => img.isMain === 1) || null,
                    gallery: variantImages.filter(img => img.isMain === 0)
                };
            });

            productList.push({
                ...product,
                categories: categoryRows,
                variations: enrichedVariants
            });
        }

        res.status(200).json({ message: 'all products list', allProducts: productList });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

const singleProduct = async (req, res) => {
    const slug = req.params.slug
    // console.log(req.params.slug)
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
            console.log(productId)
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

            const [images] = await db.query(`
                    SELECT variantId, imageUrl, altText, isMain
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
                productData,
                allVariations
            }
            res.status(200).json({ message: 'fetching single Product Data', singleProductData: singleProductData })
        }
    } catch (error) {
        console.error('single product api error', error)
        return res.status(500).json({ message: 'single product api error' })
    }
}


const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id
        await db.query(`DELETE from products WHERE id=?`, [id])

        res.status(200).json({ message: 'product deleted successfully' })
    } catch (error) {
        console.error('single product api error', error)
        res.status(500).json({ message: 'single product api error' })
    }
}


export const controller = {
    addProduct,
    getAllProducts,
    singleProduct,
    deleteProduct
}