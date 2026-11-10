const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.get('/', applicationController.getApplicationsByPost);
router.post('/', applicationController.createApplication);
router.put('/:id', applicationController.resubmitApplication);
router.patch('/:id/status', applicationController.updateApplicationStatus);
router.delete('/:id', applicationController.cancelApplication);

module.exports = router;
