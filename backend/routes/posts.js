const express = require('express');
const posts = require('../controllers/postController');
const requireAuth = require('../middlewares/requireAuth');
const router = express.Router();

router.get('/', posts.list);
router.get('/:id', posts.get);
router.post('/', requireAuth, posts.validateFields, posts.create);
router.put('/:id', requireAuth, posts.requireOwner, posts.validateFields, posts.update);
router.delete('/:id', requireAuth, posts.requireOwner, posts.remove);

module.exports = router;