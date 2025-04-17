import express from 'express'
import multer from 'multer'
import path from 'path'
import { controller } from '../controller/fabriccontroller.js'

const fabricRoutes = express.Router()

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


fabricRoutes.post('/addfabric', upload.single('fabricImage'), controller.addFabric)
fabricRoutes.get('/fabriclist', controller.fabricList)
fabricRoutes.delete('/:id', controller.fabricDelete)
fabricRoutes.post('/editfabric', upload.single('fabricImage'), controller.editFabric)

export default fabricRoutes