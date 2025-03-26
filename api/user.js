import express from 'express';
import { controller } from '../controller/userscontroller.js';
const userRoute = express.Router()


userRoute.post('/registor', controller.registorUser)
userRoute.post('/login', controller.loginUser)
userRoute.post('/verify', controller.verifyUser)
userRoute.post('/forgetpassword', controller.forgetPasswordUser)
userRoute.post('/newpassword', controller.newPasswordSave)
userRoute.post('/logoutUser', controller.logoutUser)
userRoute.get('/profile', controller.profileUser)

export default userRoute