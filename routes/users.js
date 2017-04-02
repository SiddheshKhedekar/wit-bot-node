const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const passport = require('passport')

router.post('/register', (req, res, next) => {
    res.setHeader('content-type', 'application/json');
	let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    });
    User.addUser(newUser, (err, user) => {
        if(err) {
            res.json({status: "failed", message: "couldn't save new user."});
        } else {
            res.json({status: "sucess", message: "user has  been registered."});
        }
    });
});

router.get('/profile', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.setHeader('content-type', 'application/json');
	res.json({user: req.user, message: "you are in the profile route."});
});

router.post('/authenticate', (req, res, next) => {
    res.setHeader('content-type', 'application/json');
	  let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;

    User.getUserByEmail(email, (err, user) => {
    if(err) throw err;
    if(!user){
      return res.json({success: false, msg: 'User not found'});
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;
      if(isMatch){
        const token = jwt.sign(user, "My app secret", {
          expiresIn: 604800
        });

        res.json({
          success: true,
          token: 'JWT '+token,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
          }
        });
      } else {
        return res.json({success: false, msg: 'Wrong password'});
      }
    });
  });
});

module.exports = router;