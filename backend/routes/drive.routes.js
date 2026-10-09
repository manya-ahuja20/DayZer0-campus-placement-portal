const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/drive.controller');

router.post('/', auth, c.createDrive);              // company creates
router.get('/mine', auth, c.getMyDrives);            // company views own
router.put('/:driveId', auth, c.updateDrive);        // company updates own
router.get('/all', auth, c.getAllDrives);            // admin views all (optionally ?status=pending)
router.patch('/:driveId/review', auth, c.reviewDrive); // admin approve/reject
router.patch('/company/:companyId/verify', auth, c.reviewCompany); // admin verifies company
router.get('/approved', auth, c.getApprovedDrives);  // student views approved
router.get('/companies', auth, c.getPendingCompanies); // admin views all companies (for verification)

module.exports = router;