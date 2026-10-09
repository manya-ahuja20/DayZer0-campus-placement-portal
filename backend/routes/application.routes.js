const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/application.controller');

router.post('/:driveId', auth, c.applyToDrive);
router.get('/mine', auth, c.getMyApplications);
router.delete('/:applicationId', auth, c.withdrawApplication);
router.get('/drive/:driveId', auth, c.getApplicantsForDrive);
router.patch('/:applicationId/status', auth, c.updateApplicationStatus);

module.exports = router;