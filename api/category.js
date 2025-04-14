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


categoryRoutes.post('/addcategory', upload.single('catImage'), controller.addCategory)
categoryRoutes.get('/categorylist', controller.categoryList)
categoryRoutes.delete('/:id', controller.categoryDelete)
categoryRoutes.post('/editcategory', upload.single('catImage'), controller.editCategory)

export default categoryRoutes