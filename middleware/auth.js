import jwt from "jsonwebtoken";

const authentication = async (req,res,next) => {
    const token = req.cookies?.authToken;
    console.log(token)
    if (token) {
        const decoded = jwt.verify(token, process.env.SECRET_TOKEN)
        console.log(decoded)
        req.user= decoded
        return next()
    }
    res.status(401).json({message:'unauthorized user'})
}

export default authentication