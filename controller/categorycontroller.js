import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const addCategory = async (req, res) => {
    const { name, slug, description, parentCategory } = req.body

    const imagefile = req.files.catImage[0].path;
    // console.log({ imageUrl: imagefile })
    // const iconfile = req.files.catIcon[0].path;
    // console.log({ name, slug, description, imagefile, iconfile })

    const cloudinaryImageResult = await cloudinary.uploader.upload(imagefile, { folder: 'Myckah' })
    // const cloudinaryIconResult = await cloudinary.uploader.upload(iconfile, { folder: 'Myckah' })

    if (cloudinaryImageResult) {
        try {
            const [uploadImageResult] = await db.query('INSERT INTO category_images ( imageUrl, imageAlt ) value (?,?)', [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename])

            // const [uploadIconResult] = await db.query('INSERT INTO images ( imageUrl, imageAlt ) value (?,?)', [cloudinaryIconResult.secure_url, cloudinaryIconResult.original_filename])

            if (parentCategory) {
                const [uploadCategoryResult] = await db.query('INSERT INTO categories ( name, slug, description, parentCategoryId, imageId) value (?,?,?,?,?)', [name, slug, description, parentCategory, uploadImageResult.insertId])
            }else{
                const [uploadCategoryResult] = await db.query('INSERT INTO categories ( name, slug, description, imageId) value (?,?,?,?)', [name, slug, description, uploadImageResult.insertId])
            }
            
            res.status(200).json({ message: 'category added successfully' })
        } catch (error) {
            console.error('category added api error', error)
            res.status(200).json({ message: 'category added failed and database error' })
        }
    }
}

const categoryList = async (req, res) => {

    try {
        // Fetch all categories with their image and icon details
        const [categories] = await db.query(`
            SELECT 
                c.id AS categoryId,
                c.name AS categoryName,
                c.slug AS categorySlug,
                c.description AS categoryDescription,
                parentc.name AS parentCategory,
                ci.imageUrl AS categoryImage,
                ci.imageAlt AS categoryImageAlt
            FROM 
                categories c
            LEFT JOIN 
                category_images ci ON c.imageId = ci.id
            LEFT JOIN
                categories parentc ON c.parentCategoryId = parentc.id
        `);

        // Format the response
        const result = categories.map(category => ({
            id: category.categoryId,
            name: category.categoryName,
            slug: category.categorySlug,
            description: category.categoryDescription,
            parentCategory:category.parentCategory,
            image: {
                url: category.categoryImage,
                alt: category.categoryImageAlt,
            },
        }));

        // Send the response
        res.status(200).json({ categoryList: result });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }

}

export const controller = {
    addCategory,
    categoryList
} 