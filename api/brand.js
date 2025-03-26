import express from 'express'
import multer from 'multer'
import path from 'path'
import { controller } from '../controller/brandcontroller.js'


const brandRouter = express.Router()


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

brandRouter.post('/addbrand', upload.single('brandImage'), controller.addBrand)
brandRouter.get('/brandlist', controller.brandList)


export default brandRouter