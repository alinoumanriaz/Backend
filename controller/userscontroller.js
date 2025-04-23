import db from "../database/database.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import { sendEmail } from "../helper/mailsender.js"
import { OAuth2Client } from "google-auth-library"
import env from "dotenv"
env.config();


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
            console.log({ userdata: user })
            if (user.email && !user.password) {
                return res.status(500).json({ message: "Your email already registor with google" })
            }
            const validPassword = await bcrypt.compare(password, user.password)

            if (validPassword) {
                if (!user.isVerified) {
                    const userId = user.id;
                    await sendEmail({ email, emailType: 'RESET', userId })
                    return res.status(501).json({ message: "user not verified" })
                } else {
                    const Token = {
                        userId: user.id,
                        username: user.username,
                        email: user.email,
                        userImage: user.userImage,
                        role: user.role,
                        isVerified: user.isVerified,
                        createdAt: user.createdAt,
                    }
                    const jwtToken = jwt.sign(Token, process.env.SECRET_TOKEN, { expiresIn: "1d" })
                    res.cookie('authToken', jwtToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production", // `true` in production, `false` in development
                        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
                        domain: process.env.NODE_ENV === "production" ? ".mirfah.com" : "localhost",
                        path: "/", // Ensure path is set correctly
                        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
                    })
                    return res.status(200).json({ message: "Login successful!", cUser: Token });
                }
            } else {
                return res.status(202).json({ message: "incorrect password" })
            }
        } else {
            return res.status(203).json({ message: "user not found" })
        }

    } else {
        return res.status(204).json({ message: "email and password both required" })
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
    console.log('logout api workig')
    try {
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            domain: process.env.NODE_ENV === "production" ? ".mirfah.com" : "localhost",
            path: "/"
        });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log('logout not working', error)
        return res.status(500).json({ message: 'logout not working' });
    }
}

const profileUser = async (req, res) => {
    const token = req.cookies.authToken
    // console.log({ token: token })
    try {
        if (token) {
            const decoded = jwt.verify(token, process.env.SECRET_TOKEN)
            const [userResult] = await db.query("SELECT id,username,email,role,userImage,isVerified,createdAt FROM users WHERE id=?", [decoded.userId])
            if (userResult.length > 0) {
                const cUser = userResult[0]
                return res.status(200).json({ message: 'user profile data', cUser: cUser })
            }
        } else {
            return res.status(200).json({ message: 'user not logedIn' })
        }
    } catch (error) {
        console.error('Fail getting current user', error)
        console.log('got error when finding current user data')
        return res.status(500).json({ message: 'Fail getting current user' })
    }

}

const allUser = async (req, res) => {
    try {
        const [users] = await db.query(`SELECT id, username, email, phone, role, userImage, isVerified, createdAt FROM users`)
        return res.status(200).json({ message: 'Got All user List', allUserList: users })
    } catch (error) {
        console.error('fail geting users list', error)
        console.log('Got error when fetching users data')
        return res.status(500).json({ message: 'Fail getting all user' })
    }

}
const deleteUser = async (req, res) => {
    const userId = req.params.id
    try {
        const [users] = await db.query(`DELETE from user WHERE id=?`, [userId])
        return res.status(200).json({ message: 'User deleted Succussfully' })
    } catch (error) {
        console.error('fail to delete user', error)
        console.log('Got error in deleting user')
        return res.status(500).json({ message: 'Fail deleting user' })
    }
}

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage' // Important: this must match the `redirect_uri` used by the frontend
);
const googleLogin = async (req, res) => {
    const { code } = req.body
    if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
    }
    const { tokens } = await client.getToken(code)
    const idToken = tokens.id_token;

    if (!idToken) {
        return res.status(400).json({ message: 'Google did not return an ID token' });
    }


    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    console.log({ payload: payload })

    const googleUserData = {
        username: payload.name,
        email: payload.email,
        userImage: payload.picture,
        isVerified: payload.email_verified
    }
    // first check user already registor or not
    const [checkuser] = await db.query(`SELECT id,username,email,role,userImage,isVerified,createdAt FROM users WHERE email=?`, [googleUserData.email])
    if (checkuser.length > 0) {
        const user = checkuser[0]

        const Token = {
            userId: user.id,
            username: user.username,
            email: user.email,
            userImage: user.userImage,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        }

        const jwtToken = jwt.sign(Token, process.env.SECRET_TOKEN, { expiresIn: '1d' })

        res.cookie('authToken', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // `true` in production, `false` in development
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            domain: process.env.NODE_ENV === "production" ? ".mirfah.com" : "localhost",
            path: "/", // Ensure path is set correctly
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        })
        return res.status(200).json({ message: "Login successful!", cUser: Token });

    } else {
        const [userSaveResult] = await db.query(`INSERT INTO users (username, email, userImage, isVerified) VALUE (?,?,?,?)`, [googleUserData.username, googleUserData.email, googleUserData.userImage, googleUserData.isVerified])
        const [newUser] = await db.query(`SELECT id,username,email,role,userImage,isVerified,createdAt FROM users WHERE id=?`, [userSaveResult.insertId])

        const user = newUser[0]

        const Token = {
            userId: user.id,
            username: user.username,
            email: user.email,
            userImage: user.userImage,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,

        }
        const jwtToken = jwt.sign(Token, process.env.SECRET_TOKEN, { expiresIn: '1d' })

        res.cookie('authToken', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // `true` in production, `false` in development
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            domain: process.env.NODE_ENV === "production" ? ".mirfah.com" : "localhost",
            path: "/", // Ensure path is set correctly
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        })
        return res.status(200).json({ message: "Login successful!", cUser: Token });
    }
}
// const statusUser = async ()=>{
//     const userId = req.params.id
//     try {
//         const [users] = await db.query(`DELETE from user WHERE id=?`,[userId])

//         return res.status(200).json({ message: 'User deleted Succussfully'})
//     } catch (error) {
//         console.error('fail to changing user status', error)
//         return res.status(500).json({ message: 'Changing user status action fail' })
//     }
// }

export const controller = {
    registorUser,
    loginUser,
    verifyUser,
    forgetPasswordUser,
    newPasswordSave,
    logoutUser,
    profileUser,
    allUser,
    deleteUser,
    googleLogin
}

