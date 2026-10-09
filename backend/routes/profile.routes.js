const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const c = require('../controllers/profile.controller');

router.get('/', auth, c.getProfile);
router.put('/', auth, c.updateProfile);
router.post('/resume', auth, upload.single('resume'), c.uploadResume);
router.get('/resume', auth, c.listResumes);
router.get('/resume/:resumeId/download', c.downloadResume);
router.delete('/resume/:resumeId', auth, c.deleteResume);

module.exports = router;