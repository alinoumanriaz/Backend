import db from "../database/database.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import { sendEmail } from "../helper/mailsender.js"

//user registor
const registorUser = async (req, res) => {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(200).json("All fields required")
    }

    // check user exist or not
    if (email) {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        if (existingUser.length > 0) {
            return res.status(200).json('user already exist')
        }
    }

    // now hash password
    const salt = await bcrypt.genSalt(10)
    const hashpassword = await bcrypt.hash(password, salt)

    try {
        const [result] = await db.query('INSERT INTO users (username,email,password) values (?,?,?)', [username, email, hashpassword])
        console.log({ result: result.insertId })

        try {
            const userId = result.insertId
            await sendEmail({ email, emailType: 'VERIFY', userId })
            return res.status(200).json({ message: "user registered and verification email send successfully" })
        } catch (error) {
            return res.status(200).json({ message: "verification email not sent" })
        }
    } catch (error) {
        return res.status(500).json('Error registering user')
    }
}

const loginUser = async (req, res) => {
    const { email, password } = await req.body;
    console.log(email)

    if (email || password) {
        const [userResult] = await db.query('SELECT * FROM users WHERE email=?', [email])

        if (userResult.length > 0) {
            const user = userResult[0];
            const validPassword = await bcrypt.compare(password, user.password)

            if (validPassword) {
                if (!user.isVerified) {
                    const userId = user.id;
                    await sendEmail({ email, emailType: 'RESET', userId })
                    res.status(501).json({ message: "user not verified" })
                } else {
                    const Token = {
                        userId: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                    const jwtToken = jwt.sign(Token, process.env.SECRET_TOKEN, { expiresIn: "1d" })
                    res.cookie('authToken', jwtToken, {
                        httpOnly: true,
                        secure: false,  // set to true if you're using HTTPS
                        maxAge: 24 * 60 * 60 * 1000,
                        sameSite: 'Lax', // Change 'Strict' to 'Lax' for cross-origin support
                    })
                    return res.status(200).json({ message: "Login successful!" });
                }
            } else {
                res.status(202).json({ message: "incorrect password" })
            }
        } else {
            res.status(203).json({ message: "user not found" })
        }

    } else {
        res.status(204).json({ message: "email and password both required" })
    }
}

const verifyUser = async (req, res) => {
    const { email, otp, condition } = req.body
    if (condition === 'VERIFY') {
        const [userResult] = await db.query('SELECT * FROM users WHERE email=?', [email])
        if (user.length > 0) {
            const user = userResult[0]
            if (user.verifyToken === otp && new Date() < new Date(user.verifyTokenExpiry)) {
                const [result] = await db.query('UPDATE users SET isVerified=? verifyToken=? verifyTokenExpiry=? WHERE email=?', [true, null, null, email])
                return res.status(200).json({ message: 'User verified successfully' });
            } else {
                return res.status(500).json({ message: 'otp did not match or token expire' })
            }
        } else {
            return res.status(500).json({ message: 'user not registered' })
        }
    } else if (condition === 'RESET') {
        const [userResult] = await db.query('SELECT * FROM users WHERE email=?', [email])
        if (user.length > 0) {
            const user = userResult[0]
            if (user.forgetPasswordToken === otp && new Date() < new Date(user.forgetPasswordTokenExpiry)) {
                const [result] = await db.query('UPDATE users SET forgetPasswordToken=? forgetPasswordTokenExpiry=? WHERE email=?', [null, null, email])
                return res.status(200).json({ message: 'User verified successfully' });
            } else {
                return res.status(500).json({ message: 'otp did not match or token expire' })
            }
        } else {
            return res.status(500).json({ message: 'user not registered' })
        }
    }
}

const forgetPasswordUser = async (req, res) => {
    const { email } = req.body;
    const [userResult] = await db.query('SELECT * FROM users WHERE email=?', [email])
    if (userResult.length > 0) {
        const user = userResult[0];
        await sendEmail({ email, emailType: 'RESET', userId: user.id })
        return res.status(200).json({ message: 'RESET password sent' })
    }
    return res.status(200).json({ message: 'user not registered' })
}

const newPasswordSave = async (req, res) => {
    const { email, password } = req.body;
    const [userResult] = await db.query('SELECT * FROM user WHERE email=?', [email])
    if (userResult.length > 0) {
        const user = userResult[0];
        const salt = await bcrypt.salt(10);
        const hashPassword = await bcrypt.hash(password, salt)
        const [updatepassword] = await db.query('UPDATE users SET password=? WHERE email=?', [hashPassword, email])
        return res.status(200).json({ message: 'password updated successfully' })
    }
    return res.status(200).json({ message: 'password did not update' })
}

const logoutUser = async (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true, // makes it inaccessible to JavaScript
        secure: process.env.NODE_ENV === 'production', // set secure flag in production (HTTPS)
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'Strict' // helps with CSRF protection
    });
    return res.status(200).json({ message: 'Logged out successfully' });
}

const profileUser = async (req, res) => {
    const token = req.cookies.authToken
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN)
    const [userResult] = await db.query("SELECT * FROM users WHERE id=?", [decoded.userId])
    if (userResult.length > 0) {
        const user = userResult[0]
        console.log(user)
    }
    res.status(200).json({ message: 'user profile data' })
}

export const controller = {
    registorUser,
    loginUser,
    verifyUser,
    forgetPasswordUser,
    newPasswordSave,
    logoutUser,
    profileUser
}

