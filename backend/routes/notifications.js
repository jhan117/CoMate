const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const notificationController = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', notificationController.getNotificationsByUser);
router.patch('/read-all', notificationController.markAllNotificationsAsRead);
router.delete('/', notificationController.deleteAllNotifications);
router.patch('/:id/read', notificationController.markNotificationAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
