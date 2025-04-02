const saveOrder = async (req, res) => {
    res.status(200).json({message:'save order api work'})
}

const getOrder = async (req,res) => {
    res.status(200).json({message:'get order api work'})
}

export const controller ={
    saveOrder,
    getOrder
}