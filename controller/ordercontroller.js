import db from "../database/database.js"

const saveOrder = async (req, res) => {
    res.status(200).json({ message: 'save order api work' })
}

const getOrder = async (req, res) => {

    res.status(200).json({ message: 'get order api work' })
}

const getUserOrder = async (req, res) => {
    const id = req.params.id
    console.log({cUserId:id})
    // const [OrderList] = await db.query(`SELECT * FROM ORDER WHERE userId=?`,[id])
    res.status(200).json({ message: 'get current user order api work' })
}

export const controller = {
    saveOrder,
    getOrder,
    getUserOrder
}