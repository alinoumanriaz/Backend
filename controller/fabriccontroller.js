import db from "../database/database.js";
import { v2 as cloudinary } from 'cloudinary';
import env from "dotenv";
import { getRedisClient } from "../client.js";
env.config()
// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addFabric = async (req, res) => {
    const { name, slug, description } = req.body

    try {
        const checkSlug = await db.query(`SELECT COUNT(*) as count FROM fabric WHERE slug = ? `, [slug])
        if (checkSlug[0][0].count === 1) {
            return res.status(500).json({ message: 'Duplicate slug' })
        }

        const imageFile = req.file?.path
        console.log({ imageFile: imageFile })
        if (!imageFile) {
            return res.status(500).json({ message: 'Image is required.' });
        }
        const cloudinaryImageResult = await cloudinary.uploader.upload(imageFile, { folder: 'fabric-images' });
        if (!cloudinaryImageResult) {
            return res.status(500).json({ message: 'Image upload to cloudinary failed' });
        }

        const [uploadedfabricResult] = await db.query('INSERT INTO fabric ( name, slug, description) value (?,?,?)', [name, slug, description])
        const fabricId = uploadedfabricResult.insertId

        await db.query('INSERT INTO fabric_images ( imageUrl, imageAlt, fabricId ) value (?,?,?)', [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename, fabricId])

        return res.status(200).json({ message: 'fabric added successfully' });

    } catch (error) {
        console.error('Error in adding fabric:', error);
        return res.status(500).json({ message: 'An error occurred while adding the fabric.' });
    }

}

const fabricList = async (req, res) => {

    try {
        const cacheKey = 'fabricList'
        const client = await getRedisClient()
        const cacheData = await client.get(cacheKey)
        if (cacheData) {
            console.log('✅ Returning fabric list from Redis');
            return res.status(200).json({ fabricList: JSON.parse(cacheData) })
        }
        // Fetch all categories with their image and icon details
        const [fabric] = await db.query(`
            SELECT 
                f.id AS fabricId,
                f.name AS fabricName,
                f.slug AS fabricSlug,
                f.description AS fabricDescription,
                f.updatedAt AS updatedAt,
                fi.imageUrl AS imageUrl,
                fi.imageAlt AS imageAlt
            FROM 
                fabric f
            LEFT JOIN
                fabric_images fi ON fi.fabricId = f.id
        `);

        // Format the response
        const result = fabric.map(fabric => ({
            id: fabric.fabricId,
            name: fabric.fabricName,
            slug: fabric.fabricSlug,
            description: fabric.fabricDescription,
            updatedAt: fabric.updatedAt,
            image: {
                url: fabric.imageUrl,
                alt: fabric.imageAlt,
            },
        }));

        await client.set(cacheKey, JSON.stringify(result));
        // Send the response
        return res.status(200).json({ fabricList: result });
    } catch (error) {
        console.error('Error fetching fabrics:', error);
        return res.status(500).json({ message: 'Failed to fetch fabrics' });
    }

}

const fabricDelete = async (req, res) => {
    try {
        const fabricId = req.params.id
        await db.query('DELETE FROM fabric WHERE id = ?', [fabricId])
        return res.status(200).json({ message: 'fabric deleted successfully' })
    } catch (error) {
        console.error('Error in delete category', error)
        return res.status(500).json({ message: 'failed to delete fabric' })
    }
}


const editFabric = async (req, res) => {
    const { id, name, slug, description } = req.body
    try {
        await db.query(`UPDATE fabric SET name=?, slug=?, description=? WHERE id=?`, [name, slug, description, id])
        const imageFile = req.file?.path
        if (imageFile) {
            const cloudinaryImageResult = await cloudinary.uploader.upload(imageFile, { folder: 'fabric-images' });
            await db.query(`UPDATE fabric_images SET imageUrl=?, imageAlt=? WHERE fabricId=? `, [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename, id])
            return res.status(200).json({ message: 'fabric edit successfully' })
        }
        return res.status(200).json({ message: 'fabric edit successfully' })


    } catch (error) {
        console.error('Error in edit fabric', error)
        return res.status(500).json({ message: 'failed to edit fabric' })
    }
}

export const controller = {
    addFabric,
    fabricList,
    fabricDelete,
    editFabric
}