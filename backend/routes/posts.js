const express = require('express');
const posts = require('../controllers/postController');

const router = express.Router();

router.get('/', posts.list);
router.get('/:id', posts.get);
router.post('/', posts.requireActor, posts.validateFields, posts.create);
router.put('/:id', posts.requireActor, posts.requireOwner, posts.validateFields, posts.update);
router.delete('/:id', posts.requireActor, posts.requireOwner, posts.remove);

module.exports = router;