const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/eligibility.controller');

router.post('/:driveId', auth, c.setCriteria);
router.get('/:driveId', auth, c.getCriteria);
router.get('/:driveId/check', auth, c.checkEligibility);
router.get('/student/drives', auth, c.getApprovedDrivesWithEligibility);

module.exports = router;