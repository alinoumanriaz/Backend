import express from 'express'
import { controller } from '../controller/categorycontroller.js'
import multer from 'multer'
import path from 'path'

const categoryRoutes = express.Router()

const storage = multer.diskStorage({
    // destination: './public/images/uploads',
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const nameWithoutExt = path.basename(originalName, path.extname(originalName));
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, nameWithoutExt + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })


categoryRoutes.post('/addcategory', upload.fields([{ name: 'catImage', maxCount: 1 }, { name: 'catIcon', maxCount: 1 }]), controller.addCategory)
// categoryRoutes.post('/deletecategory', controller.deleteCategory)
categoryRoutes.get('/categorylist', controller.categoryList)

export default categoryRoutes