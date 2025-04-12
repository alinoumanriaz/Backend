const addReview = async (req, res) => {
    console.log('review api work')
    res.status(200).json('add review api work')
}

const allReviewList = async (req, res) => {
    console.log('review api work')
    res.status(200).json('all review get api work')
}

export const controller = {
    addReview,
    allReviewList
}