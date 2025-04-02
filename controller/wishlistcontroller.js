import db from "../database/database.js"


const wishlistAdd = async (req, res) => {
    const { userId, productId } = req.body
    console.log(userId, productId)
    const [addToWishlistResult] = await db.query('INSERT INTO wishlist (userId,productId) VALUES (?,?)', [userId, productId])
    console.log(addToWishlistResult)
    res.status(200).json({ message: 'wishlist api' })
}

const currentUserWishlist = async (req,res)=>{
    const user = req.user
    console.log(req.user)
    const [currentWishlist]= await db.query('SELECT w.id, p.name, p.slug, p.price, p.salePrice, ( SELECT pi.imageUrl FROM product_images pi WHERE pi.productId = p.id ORDER BY pi.id ASC LIMIT 1) AS image FROM wishlist w INNER JOIN products p ON w.productId = p.id WHERE w.userId=?',[user.userId])
    // const [currentWishlist]= await db.query('SELECT w.id, p.name,pi.imageUrl FROM wishlist w INNER JOIN products p ON w.productId=p.id LEFT JOIN product_images pi ON p.id= pi.productId WHERE userId=?',[user.userId])
    res.status(200).json({message:'api working ',result:currentWishlist})
}

export const controller = {
    wishlistAdd,
    currentUserWishlist
}