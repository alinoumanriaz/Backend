
// import { v2 as Cloudinary } from 'cloudinary';
import cloudinary from '../cloudinary.js';


const getAllImages = async (req, res) => {
    try {
        const folders = ['Gallery','fabric-images', 'product_images', 'category-images'];
        let allImages = [];

        for (const folder of folders) {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: `${folder}/`,
                max_results: 100,
            });

            allImages.push(...result.resources);
        }

        let images = allImages
        images.map(img => ({
            url: img.secure_url
        }))

        res.status(200).json(images);
    } catch (error) {
        console.error('Cloudinary fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch images from Cloudinary' });
    }
}

const addImages = async (req, res) => {
    console.log(req.files)
    const imageFiles = req.files
    if (!imageFiles) {
        return res.status(500).json({ message: 'Image is required.' });
    }
    try {
        const cloudinaryResult = await Promise.all(
            imageFiles.map((file) => {
                return cloudinary.uploader.upload(file.path, { folder: 'Gallery' });
            })
        );
        console.log({cloudinaryResult:cloudinaryResult})
        const images = cloudinaryResult.map(img => ({
            url: img.secure_url
        }));
        return res.status(200).json({ message: 'Images uploaded successfully', images:images });
        
    } catch (error) {
        console.error('Error uploading images to Cloudinary:', error);
        return res.status(500).json({ message: 'Failed to upload images' });
    }
}

export const controller = {
    getAllImages,
    addImages
} 