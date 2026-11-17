const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const applicationController = require('../controllers/applicationController');

router.use(requireAuth);

router.get('/', applicationController.getApplicationsByPost);
router.get('/:id', applicationController.getApplicationById);
router.post('/', applicationController.createApplication);
router.put('/:id', applicationController.resubmitApplication);
router.patch('/:id/status', applicationController.updateApplicationStatus);
router.delete('/:id', applicationController.cancelApplication);

module.exports = router;
