import db from "../database/database.js"
import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const addCategory = async (req, res) => {
    const { name, slug, description } = req.body
    // console.log(req.files)

    const imagefile = req.files.catImage[0].path;
    // console.log({ imageUrl: imagefile })
    const iconfile = req.files.catIcon[0].path;
    // console.log({ name, slug, description, imagefile, iconfile })

    const cloudinaryImageResult = await cloudinary.uploader.upload(imagefile, { folder: 'Myckah' })
    const cloudinaryIconResult = await cloudinary.uploader.upload(iconfile, { folder: 'Myckah' })

    if (cloudinaryImageResult) {
        try {
            const [uploadImageResult] = await db.query('INSERT INTO images ( imageUrl, imageAlt ) value (?,?)', [cloudinaryImageResult.secure_url, cloudinaryImageResult.display_name])

            const [uploadIconResult] = await db.query('INSERT INTO images ( imageUrl, imageAlt ) value (?,?)', [cloudinaryIconResult.secure_url, cloudinaryIconResult.display_name])

            const [uploadCategoryResult] = await db.query('INSERT INTO categories ( name, slug, description, imageId, iconId) value (?,?,?,?,?)', [name, slug, description, uploadImageResult.insertId, uploadIconResult.insertId])
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
                img.imageUrl AS categoryImage,
                img.imageAlt AS categoryImageAlt,
                icon.imageUrl AS categoryIcon,
                icon.imageAlt AS categoryIconAlt
            FROM 
                categories c
            LEFT JOIN 
                images img ON c.imageId = img.id
            LEFT JOIN 
                images icon ON c.iconId = icon.id
        `);

        // Format the response
        const result = categories.map(category => ({
            id: category.categoryId,
            name: category.categoryName,
            slug: category.categorySlug,
            description: category.categoryDescription,
            image: {
                url: category.categoryImage,
                alt: category.categoryImageAlt,
            },
            icon: {
                url: category.categoryIcon,
                alt: category.categoryIconAlt,
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