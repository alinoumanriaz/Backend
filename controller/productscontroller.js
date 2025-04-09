import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addProduct = async (req, res) => {
    const { name, slug, description, colorCode, colorName, gender, price, stock, brand, category, salePrice, status, fabric } = req.body
    console.log(brand)
    const images = req.files

    if (images.length === 0) {
        return res.status(500).json({ message: 'no image upload' })
    }

    try {
        const uploadedImages = [];
        for (let i = 0; i < images.length; i++) {
            const cloudinaryResult = await cloudinary.uploader.upload(images[i].path, { folder: 'Myckah' })

            uploadedImages.push({
                imageUrl: cloudinaryResult.secure_url,
                altText: cloudinaryResult.original_filename
            })
        }


        const [productAddResult] = await db.query('INSERT INTO products (name,slug,description,colorCode,colorName,gender,price,stock,salePrice,status,brandId,fabric) values (?,?,?,?,?,?,?,?,?,?,?,?)', [name, slug, description, colorCode, colorName, gender, price, stock, salePrice, status, brand, fabric])
        const productId = productAddResult.insertId


        const imageValues = uploadedImages.map(image => [
            productId, image.imageUrl, image.altText
        ]);

        const [addProductImages] = await db.query('INSERT INTO product_images (productId,imageUrl,altText) values ?', [imageValues])



        // covert string nmbeer array into integer nmber array
        const categortId = category.map((item) => parseInt(item, 10))


        // Step 5: Insert categories into 'product_categories' table
        for (let i = 0; i < categortId.length; i++) {
            await db.query('INSERT INTO products_categories (productId, categoryId) VALUES (?, ?)', [productId, categortId[i]]);
        }
        const [product] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

        res.status(200).json({ product: product })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'product adding error' })
    }
}

const getAllProducts = async (req, res) => {
    try {
        // Fetch all products
        const [products] = await db.query('SELECT p.*, b.name AS brandName, b.slug AS brandSlug, pc.colorName AS colorName, pc.colorCode AS colorCode FROM products p INNER JOIN brands b ON p.brandId=b.id INNER JOIN product_color pc ON p.colorId=pc.id ');

        // For each product, fetch associated images and categories
        const productsWithDetails = await Promise.all(
            products.map(async (product) => {
                // Fetch images for the product
                const [images] = await db.query(
                    'SELECT imageUrl, altText FROM product_images WHERE productId = ?',
                    [product.id]
                );

                // Fetch categories for the product
                const [categories] = await db.query(
                    `SELECT c.id, c.name, c.slug 
                     FROM categories c
                     INNER JOIN products_categories pc ON c.id = pc.categoryId
                     WHERE pc.productId = ?`,
                    [product.id]
                );

                const colordetail = {
                    colorName: product.colorName,
                    colorCode: product.colorCode

                }

                // Combine product details with images and categories
                return {
                    ...product,
                    colordetail: colordetail,
                    images,
                    categories,
                };
            })
        );

        // Send the response
        res.status(200).json({ products: productsWithDetails });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

const singleProduct = async (req, res) => {
    const slug = req.params.slug
    // console.log(req.params.slug)
    try {
        const [productResult] = await db.query(`SELECT p.*, b.name AS brandname,b.slug AS brandslug,b.description AS branddescription,i.imageUrl AS brand_imageurl, i.imageAlt AS brand_imagealt FROM products p LEFT JOIN brands b ON p.brandId= b.id LEFT JOIN images i ON b.imageId=i.id WHERE p.slug=?`, [slug])
        if (productResult.length > 0) {

            const productData = productResult[0]
            const productId = productResult[0].id
            // console.log(productResult)

            const [productImages] = await db.query('SELECT * FROM product_images WHERE productId=?', [productId])
            // console.log(productImages)
            const [categoriesResult] = await db.query('SELECT c.id,c.name,c.slug,i.imageUrl,i.imageAlt FROM products_categories pc JOIN categories c ON pc.categoryId=c.id LEFT JOIN images i ON c.imageId=i.id WHERE productId=?', [productId])
            // console.log(categoriesResult)
            const singleProductData = {
                productData,
                images: productImages,
                category: categoriesResult
            }
            // console.log({singleProductData:singleProductData})
            res.status(200).json({ message: singleProductData })
        }
    } catch (error) {
        console.error('single product api error', error)
        res.status(500).json({ message: 'single product api error' })
    }

}
export const controller = {
    addProduct,
    getAllProducts,
    singleProduct
}