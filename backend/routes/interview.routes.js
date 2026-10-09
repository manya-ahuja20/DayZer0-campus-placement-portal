const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/interview.controller');

router.post('/drive/:driveId', auth, c.createRound);
router.get('/drive/:driveId', auth, c.getRoundsForDrive);
router.get('/mine', auth, c.getMyRounds);
router.delete('/:roundId', auth, c.deleteRound);
router.post('/:roundId/book', auth, c.bookRound);
router.delete('/:roundId/book', auth, c.cancelBooking);

module.exports = router;