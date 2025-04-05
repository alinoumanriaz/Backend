import { v2 as cloudinary } from 'cloudinary';
import db from '../database/database.js';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addBrand = async (req, res) => {
    const { name, slug, description } = req.body;
    const brandImage = req.file.path;

    try {
        const cloudinaryImageResult = await cloudinary.uploader.upload(brandImage, { folder: 'Myckah' })
        if (cloudinaryImageResult) {
            const [addImageResult] = await db.query('INSERT INTO images (imageUrl,imageAlt) VALUE (?,?)', [cloudinaryImageResult.secure_url, cloudinaryImageResult.original_filename])
            const [addBrandResult] = await db.query('INSERT INTO brands ( name, slug, description, imageId) value (?,?,?,?)', [name, slug, description, addImageResult.insertId])
            res.status(200).json({ message: 'brand api worked' })
        }
    } catch (error) {
        console.error('got error in uploading new brand', error)
        console.log('got error in uploading new brand')
    }


}

const brandList = async (req, res) => {
    try {
        const [brandList] = await db.query(`SELECT brands.id, brands.name, images.imageUrl, images.imageAlt FROM brands INNER JOIN images ON brands.imageId = images.id`)
        // console.log(brandList)
        res.status(200).json({ message: 'Got brand list successfully', result: brandList })
    } catch (error) {
        console.error('got error in geting brands list', error);
    }

}

export const controller = {
    addBrand,
    brandList
}