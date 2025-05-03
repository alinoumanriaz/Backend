import express from 'express'
import { controller } from '../controller/fabriccontroller.js'

const fabricRoutes = express.Router()


fabricRoutes.post('/addfabric', controller.addFabric)
fabricRoutes.get('/fabriclist', controller.fabricList)
fabricRoutes.delete('/:id', controller.fabricDelete)
fabricRoutes.post('/editfabric', controller.editFabric)

export default fabricRoutes