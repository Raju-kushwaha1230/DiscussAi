const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const { OAuth2Client } = require('google-auth-library');

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

const googleLogin = async (req, res) => {
    const { access_token } = req.body;
    try {
        // Fetch user profile from Google using the access_token
        const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        if (!googleResponse.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        const payload = await googleResponse.json();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name,
                email,
                googleId
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: 'Google login successful', user, token });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Internal server error during Google login' });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    googleLogin
}
