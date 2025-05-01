import db from "../database/database.js"

const addReview = async (req, res) => {
    const { message, rating, productId, userId } = req.body
    if (!rating) {
        return res.status(400).json({ message: 'rating must required' })
    }
    await db.query(`INSERT INTO reviews (comment,rating,productId,userId) VALUES (?,?,?,?)`, [message, rating, productId, userId])
    console.log('review api work')
    return res.status(200).json({ message: 'add review api work' })
}

const allReviewList = async (req, res) => {
    const { id } = req.params
    const [reviewlist] = await db.query(`SELECT r.*, u.username AS username FROM reviews r JOIN users u ON u.id=r.userId WHERE productId=?`, [id])
    res.status(200).json({ message: 'all review get api work', result: reviewlist })
}

export const controller = {
    addReview,
    allReviewList
}