const jwt = require('jsonwebtoken')
require('dotenv').config()
const User = require('../models/user')
const expressjwt = require('express-jwt')
const _ = require('lodash')
const {sendEmail} = require('../helpers')


exports.signup = async (req,res) => {
    try{
        const userExists = await User.findOne({ email: req.body.email })
        const usernameExists = await User.findOne({ name: req.body.name })
        if(userExists)
            return res.status(403).json({
                error: "Email is taken!"
            });
        if(usernameExists)
            return res.status(403).json({
                error: "user_name taken! try something different"
            });
        const user = await new User(req.body)
        await user.save()
        res.status(200).json({ message: "Signup sucessfull please login" })
    }
    catch(error){
        console.log(`That did not go well: ${error}`);

    }

};

exports.signin = (req,res) => {
    const {email,password} = req.body
    User.findOne({email},(err,user) =>  {
        if(err || !user) {
            return res.status(401).json({
                error: "User with that email not found.Please Signup"
            })
        }
        if(!user.authenticate(password)) {
            return res.status(401).json({
                error: "Email and Password do not match here"
            })

        }

        const token = jwt.sign({_id: user._id}, process.env.jwt_secret);
        //const decode = jwt.verify(token,process.env.jwt_secret)
        //console.log(decode._id)
        //iat tells the time of token creation

        res.cookie("t", token, {expire: new Date() + 9999});

        const {_id,name,email} = user
        return res.json({token, user: {_id,name,email} })


    })


};

exports.signout = (req,res) => {
    res.clearCookie("t");
    return res.json({ message: "Signout success!" });
}

exports.requireSignin = expressjwt({

    secret: process.env.jwt_secret,
    userProperty: "auth"

})

//forgotpassword and resetpassword methods

exports.forgotPassword = (req,res) => {
    console.log("hi")
    if (!req.body) return res.status(400).json({message: "No request body"})
    if (!req.body.email) return res.status(400).json({message: "No email in request body"})

    console.log("Forgot password finding user with that email")
    const {email} = req.body
    console.log(email)
    User.findOne({email},(err,user) => {
        if(err || !user) {
            return res.status("401").json({
                error:"User with that email does not exist!"
            })
        }
        console.log(user)
        const token = jwt.sign(
            {_id:user._id,iss:"NODEFOLDER"},
            process.env.jwt_secret
        )
        //email data
        const emailData = {
            from: 'noreply@node-react.com',
            to: email,
            subject: 'Password Reset Instructions',
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        }
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                })
            }
        })
        
    })
}

exports.resetPassword = (req, res) => {
    console.log(req.body)
    const { resetPasswordLink, newPassword } = req.body;

    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status('401').json({
                error: 'Invalid Link!'
            });

        console.log(user)

        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ''
        };


        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            console.log(user)
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};



