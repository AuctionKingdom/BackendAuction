const express = require('express')
const { userById,allUsers,getUser,deleteUser } = require('../Controllers/user')
const { requireSignin } = require('../Controllers/auth')

const router = express.Router();

router.get('/users', allUsers);
router.get('/user/:userId', requireSignin, getUser);
router.delete('/user/:userId', requireSignin, deleteUser);

// any routes containing  userId ,our app will first execute userById() 
router.param("userId", userById);

module.exports = router;



