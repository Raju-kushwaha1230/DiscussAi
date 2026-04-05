const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/User')

const register = async (req, res)=>{
    const {name, email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message:'user already exists'})
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password:hashedPassword
        })
        await newUser.save();
        console.log(" User registered  ")
        const token = jwt.sign({id:newUser._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({ success: true, message:'user registered successfully', user: newUser, token:token })

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'internal server error'})
        
    }
}

const login = async(req, res)=>{
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:'user not found'})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({message:'invalid credentials'})
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});

        res.status(200).json({ success: true, message:'user logged in successfully', user: user, token:token })

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'internal server error'})
    }
}

const getProfile = async(req, res)=>{
    try {
        res.status(200).json({ success: true, user: req.user })
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'internal server error'})
    }
}



module.exports = {
    register,
    login,
    getProfile
}
