const express          = require('express');
const adminController  = require('../controllers/adminController');

const router = express.Router();

router.get('/',              adminController.showPanel);
router.get('/api/users',     adminController.getUsers);
router.post('/api/users',    adminController.createUser);
router.delete('/api/users/:id',          adminController.deleteUser);
router.put('/api/users/:id/password',    adminController.resetUserPassword);
router.post('/api/reset',               adminController.resetDb);

module.exports = router;
