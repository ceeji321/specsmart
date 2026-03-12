const bcrypt = require('bcrypt');
const pool = require('../Db');

exports.registerUser = async (req, res) => {
    const {username, email, password} = req.body;  // ✅ Add email

    try{
        const hasedPassword = await bcrypt.hash(password, 10)
        const result = await pool.query(
            'INSERT INTO users(username, email, password) VALUES($1,$2,$3) RETURNING *',
            [username, email, hasedPassword]  // ✅ Include email
        );
        res.status(201).json({message: 'USER REGISTERED', user: result.rows[0]});
    } catch (error){
        console.error('Error registering user:', error);
        res.status(500).json({message:'INTERNAL SERVER ERROR'})
    }
};