import express from 'express'
import { controller } from '../controller/productscontroller.js'
const productRoutes = express.Router()


productRoutes.post('/addproduct', controller.addProduct)
productRoutes.get('/allproducts', controller.getAllProducts)
productRoutes.get('/:slug', controller.singleProduct)
productRoutes.delete('/delete', controller.deleteProduct)
productRoutes.get('/edit/:id', controller.singleProductGetForEdit)
productRoutes.post('/editproduct/:id', controller.editProduct)


export default productRoutes