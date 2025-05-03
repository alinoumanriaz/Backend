import express from 'express'
import { controller } from '../controller/categorycontroller.js'
const categoryRoutes = express.Router()

categoryRoutes.post('/addcategory', controller.addCategory)
categoryRoutes.get('/categorylist', controller.categoryList)
categoryRoutes.delete('/:id', controller.categoryDelete)
categoryRoutes.post('/editcategory', controller.editCategory)

export default categoryRoutes