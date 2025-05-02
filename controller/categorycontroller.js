import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';
import env from "dotenv";
import { getRedisClient } from "../client.js";
// import { getRedisClient } from "../client.js";
env.config()

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addCategory = async (req, res) => {
    const { name, slug, description, parentCategory } = req.body

    try {
        const checkSlug = await db.query(`SELECT COUNT(*) as count FROM categories WHERE slug = ? `, [slug])
        if (checkSlug[0][0].count === 1) {
            return res.status(500).json({ message: 'Duplicate slug' })
        }

        const imageFile = req.file?.path
        if (!imageFile) {
            return res.status(500).json({ message: 'Image is required.' });
        }
        const cloudinaryImageResult = await cloudinary.uploader.upload(imageFile, { folder: 'category-images' });
        if (!cloudinaryImageResult) {
            return res.status(500).json({ message: 'Image upload to cloudinary failed' });
        }

        let categoryId
        if (parentCategory) {
            const [uploadCategoryResult] = await db.query('INSERT INTO categories ( name, slug, description, parentCategoryId) value (?,?,?,?)', [name, slug, description, parentCategory])
            categoryId = uploadCategoryResult.insertId
        } else {
            const [uploadCategoryResult] = await db.query('INSERT INTO categories ( name, slug, description) value (?,?,?)', [name, slug, description])
            categoryId = uploadCategoryResult.insertId
        }

        await db.query('INSERT INTO category_images ( imageUrl, imageAlt, categoryId ) value (?,?,?)', [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename, categoryId])

        const client = await getRedisClient()
        await client.del('categoryList')


        return res.status(200).json({ message: 'Category added successfully' });

    } catch (error) {
        console.error('Error in adding category:', error);
        return res.status(500).json({ message: 'An error occurred while adding the category.' });
    }

}

const categoryList = async (req, res) => {

    try {

        const cacheKey = 'categoryList';
        const client = await getRedisClient()
        // 1️⃣ Check Redis cache first
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            console.log('✅ Returning category list from Redis');
            return res.status(200).json({ categoryList: JSON.parse(cachedData) });
        }


        // Fetch all categories with their image and icon details
        const [categories] = await db.query(`
            SELECT 
                c.id AS categoryId,
                c.name AS categoryName,
                c.slug AS categorySlug,
                c.description AS categoryDescription,
                c.updatedAt AS updatedAt,
                parentc.name AS parentCategory,
                ci.imageUrl AS imageUrl,
                ci.imageAlt AS imageAlt
            FROM 
                categories c
            LEFT JOIN
                category_images ci ON ci.categoryId = c.id
            LEFT JOIN
                categories parentc ON c.parentCategoryId = parentc.id
        `);

        // Format the response
        const result = categories.map(category => ({
            id: category.categoryId,
            name: category.categoryName,
            slug: category.categorySlug,
            description: category.categoryDescription,
            parentCategory: category.parentCategory,
            updatedAt: category.updatedAt,
            image: {
                url: category.imageUrl,
                alt: category.imageAlt,
            },
        }));

        // 3️⃣ Save to Redis
        await client.set(cacheKey, JSON.stringify(result));

        // Send the response
        return res.status(200).json({ categoryList: result });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Failed to fetch categories' });
    }

}

const categoryDelete = async (req, res) => {
    try {
        const categoryId = req.params.id
        await db.query('DELETE FROM categories WHERE id = ?', [categoryId])
        const client = await getRedisClient()
        await client.del('categoryList')
        return res.status(200).json({ message: 'category deleted successfully' })
    } catch (error) {
        console.error('Error in delete category', error)
        return res.status(500).json({ message: 'failed to delete categry' })
    }
}

const editCategory = async (req, res) => {
    const { id, name, slug, description, parentCategory } = req.body
    try {

        if (parentCategory) {
            await db.query(`UPDATE categories SET name=?, slug=?, description=?, parentCategoryId=? WHERE id=?`, [name, slug, description, parentCategory, id])
            const imageFile = req.file?.path
            if (imageFile) {
                const cloudinaryImageResult = await cloudinary.uploader.upload(imageFile, { folder: 'category-images' });
                await db.query(`UPDATE category_images SET imageUrl=?, imageAlt=? WHERE categoryId=? `, [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename, id])

                const client = await getRedisClient()
                await client.del('categoryList')

                return res.status(200).json({ message: 'category edit successfully' })
            }
            return res.status(200).json({ message: 'category edit successfully' })
        } else {
            await db.query(`UPDATE categories SET name=?, slug=?, parentCategoryId=NULL, description=? WHERE id=?`, [name, slug, description, id])
            const imageFile = req.file?.path
            if (imageFile) {
                const cloudinaryImageResult = await cloudinary.uploader.upload(imageFile, { folder: 'category-images' });
                await db.query(`UPDATE category_images SET imageUrl=?, imageAlt=? WHERE categoryId=? `, [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename, id])

                const client = await getRedisClient()
                await client.del('categoryList')

                return res.status(200).json({ message: 'category edit successfully' })
            }
            return res.status(200).json({ message: 'category edit successfully' })
        }

    } catch (error) {
        console.error('Error in edit category', error)
        return res.status(500).json({ message: 'failed to edit categry' })
    }
}

export const controller = {
    addCategory,
    categoryList,
    categoryDelete,
    editCategory
} 