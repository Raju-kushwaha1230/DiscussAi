const express = require('express');
const { register, login, getProfile, googleLogin } = require('../controllers/authController');
const router =  express.Router()
const {protect} = require('../middleware/authMiddleware')


router.post('/register',register);
router.post('/login', login )
router.post('/google', googleLogin);
router.get('/profile', protect, getProfile);


module.exports = router