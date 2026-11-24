const express = require('express');
const auth = require('../controllers/authController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.get('/me', requireAuth, auth.me);
router.post('/logout', auth.logout);

module.exports = router;