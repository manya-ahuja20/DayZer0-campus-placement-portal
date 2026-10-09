const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/notification.controller');

router.get('/', auth, c.list);
router.patch('/read-all', auth, c.markAllRead);
router.patch('/:id/read', auth, c.markRead);

module.exports = router;