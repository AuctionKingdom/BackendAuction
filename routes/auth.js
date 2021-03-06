const express = require('express')
const { signup,signin,signout,forgotPassword,resetPassword, checkJwt} = require('../Controllers/auth')
const { userById } = require('../Controllers/user')
const {userSignupValidator,passwordResetValidator} = require('../validators')

const router = express.Router();

router.post('/jwt', checkJwt);
router.post('/signup', userSignupValidator, signup);
router.post('/signin', signin);
router.get('/signout', signout);

//password forgot and reset routes
router.put("/forgot-password",forgotPassword)
router.put("/reset-password",passwordResetValidator, resetPassword)

// any routes containing  userId ,our app will first execute userById()
router.param("userId", userById);

module.exports = router;
