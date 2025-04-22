import app from 'express'
import { controller } from '../controller/wishlistcontroller.js';
import authentication from '../middleware/auth.js';
const wishlistRouter = app.Router();

wishlistRouter.post('/wishlistadd', controller.wishlistAdd )
wishlistRouter.get('/currentuserwishlist', authentication, controller.currentUserWishlist )
wishlistRouter.delete('/:id', controller.deleteWishlist )

export default wishlistRouter