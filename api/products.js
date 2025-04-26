import express from 'express'
import { controller } from '../controller/productscontroller.js'
import multer from 'multer'
const productRoutes = express.Router()
import path from 'path'

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const nameWithoutExt = path.basename(originalName, path.extname(originalName));
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, nameWithoutExt + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

productRoutes.post('/addproduct', upload.any(), controller.addProduct)
productRoutes.get('/allproducts', controller.getAllProducts)
productRoutes.get('/:slug', controller.singleProduct)
productRoutes.delete('/delete', controller.deleteProduct)

export default productRoutes