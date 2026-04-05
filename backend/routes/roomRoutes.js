const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoomDetails, getRoomByCode, getPublicRooms, getUserHistory } = require('../controllers/roomController');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/public', getPublicRooms);
router.get('/history/:userId', getUserHistory);
router.get('/:id', getRoomDetails);
router.get('/code/:code', getRoomByCode);

module.exports = router;
