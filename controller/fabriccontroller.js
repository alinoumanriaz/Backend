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
    const { name, slug, description, imageUrl } = req.body
    console.log({ reqbody: req.body })

    try {
        const checkSlug = await db.query(`SELECT COUNT(*) as count FROM fabric WHERE slug = ? `, [slug])
        if (checkSlug[0][0].count === 1) {
            return res.status(500).json({ message: 'Duplicate slug' })
        }

        if (!imageUrl) {
            return res.status(500).json({ message: 'Image is required.' });
        }

        const [uploadedfabricResult] = await db.query('INSERT INTO fabric ( name, slug, description) value (?,?,?)', [name, slug, description])
        const fabricId = uploadedfabricResult.insertId

        await db.query('INSERT INTO fabric_images ( imageUrl, fabricId ) value (?,?)', [imageUrl, fabricId])

        const client = await getRedisClient()
        await client.del('fabricList')

        return res.status(200).json({ message: 'fabric added successfully' });

    } catch (error) {
        console.error('Error in adding fabric:', error);
        return res.status(500).json({ message: 'An error occurred while adding the fabric.' });
    }

}

const fabricList = async (req, res) => {
    try {
        const cacheKey = 'fabricList';
        const client = await getRedisClient();

        // 1️⃣ Check Redis cache first
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            console.log('✅ Returning fabric list from Redis');
            return res.status(200).json({ fabricList: JSON.parse(cachedData) });
        }

        // 2️⃣ Fetch fabric data with images
        const [fabric] = await db.query(`
            SELECT 
                f.id AS fabricId,
                f.name AS fabricName,
                f.slug AS fabricSlug,
                f.description AS fabricDescription,
                f.updatedAt AS updatedAt,
                fi.imageUrl AS imageUrl
            FROM 
                fabric f
            LEFT JOIN
                fabric_images fi ON fi.fabricId = f.id
        `);

        // 3️⃣ Format the response
        const result = fabric.map(fabric => ({
            id: fabric.fabricId,
            name: fabric.fabricName,
            slug: fabric.fabricSlug,
            description: fabric.fabricDescription,
            updatedAt: fabric.updatedAt,
            image: {
                url: fabric.imageUrl,
            },
        }));

        // 4️⃣ Save the fabric list to Redis with an expiration of 1 hour (3600 seconds)
        await client.set(cacheKey, JSON.stringify(result));

        // 5️⃣ Send the response with fabric list data
        return res.status(200).json({ fabricList: result });

    } catch (error) {
        console.error('Error fetching fabrics:', error);

        // Redis error handling
        // if (error.message.includes('redis')) {
        //     return res.status(500).json({ message: 'Failed to connect to Redis, fallback to DB' });
        // }

        return res.status(500).json({ message: 'Failed to fetch fabrics' });
    }
};


const fabricDelete = async (req, res) => {
    try {
        const fabricId = req.params.id
        console.log({ fabricId: fabricId })
        await db.query('DELETE FROM fabric WHERE id = ?', [fabricId])

        const client = await getRedisClient()
        await client.del('fabricList')

        return res.status(200).json({ message: 'fabric deleted successfully' })
    } catch (error) {
        console.error('Error in delete category', error)
        return res.status(500).json({ message: 'failed to delete fabric' })
    }
}


const editFabric = async (req, res) => {
    const { id, name, slug, description, imageUrl } = req.body
    try {
        await db.query(`UPDATE fabric SET name=?, slug=?, description=? WHERE id=?`, [name, slug, description, id])

        if (imageUrl) {
            await db.query(`UPDATE fabric_images SET imageUrl=? WHERE fabricId=? `, [imageUrl, id])
            const client = await getRedisClient()
            await client.del('fabricList')
            return res.status(200).json({ message: 'fabric edit successfully' })
        }
        const client = await getRedisClient()
        await client.del('fabricList')
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