import db from "../database/database.js"


const wishlistAdd = async (req, res) => {
    const { userId, productId } = req.body
    const [addToWishlistResult] = await db.query('INSERT INTO wishlist (userId,productId) VALUES (?,?)', [userId, productId])
    res.status(200).json({ message: 'wishlist api' })
}

const currentUserWishlist = async (req, res) => {
    const user = req.user
    const [currentWishlist] = await db.query(`
        SELECT 
          w.id, 
          p.name, 
          p.slug, 
          (
            SELECT pi.imageUrl 
            FROM product_images pi 
            WHERE pi.productId = p.id 
            ORDER BY pi.id ASC 
            LIMIT 1
          ) AS image,
          (
            SELECT JSON_OBJECT('price', pv.price, 'salePrice', pv.salePrice)
            FROM product_variants pv 
            WHERE pv.productId = p.id 
            ORDER BY pv.variantId ASC 
            LIMIT 1
          ) AS variant
        FROM wishlist w 
        INNER JOIN products p ON w.productId = p.id 
        WHERE w.userId = ?
      `, [user.userId]);
    res.status(200).json({ message: 'api working ', result: currentWishlist })
}

const deleteWishlist = async (req, res)=>{
  const id = req.params.id
  await db.query(`DELETE FROM wishlist WHERE id=?`,[id])
  return res.status(200).json({message:'wishlist deleted successfully'})
}

export const controller = {
    wishlistAdd,
    currentUserWishlist,
    deleteWishlist
}