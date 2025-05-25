import express from 'express'
import { controller } from '../controller/ordercontroller.js'

const orderRouters = express.Router()

orderRouters.post('/addorder',controller.saveOrder)
orderRouters.get('/getorder', controller.getOrder)
orderRouters.get('/:id', controller.getUserOrder)
orderRouters.post('/payment-intent', controller.paymentIntent)

export default orderRouters