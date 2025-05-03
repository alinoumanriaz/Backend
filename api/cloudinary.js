import { Router } from 'express';
import { controller } from '../controller/cloudinarycontroller.js';
import multer from 'multer';
import path from 'path'

const cloudinaryRouter = Router()

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const nameWithoutExt = path.basename(originalName, path.extname(originalName));
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, nameWithoutExt + '-' + uniqueSuffix)
    }
})
const upload = multer({ storage: storage })

cloudinaryRouter.get('/all-images', controller.getAllImages);
cloudinaryRouter.post('/addimages', upload.array('images', 12), controller.addImages);

export default cloudinaryRouter;
