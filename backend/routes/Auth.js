const express = require("express")
const router = express.Router();
const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const User = require("../models/User")
const { query,body, validationResult } = require('express-validator');
const JWT_SECRET = "karyakartha"

function generateResetToken() {
    return crypto.randomBytes(20).toString("hex");
  }
  function sendResetEmail(user, resetToken) {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "example@gmail.com",
        pass: "email_password",
      },
    });
  
    const resetURL = `http://frontend/reset-password/${resetToken}`;
  
    const mailOptions = {
      to: user.email,
      from: "your_email@gmail.com",
      subject: "Password Reset",
      text: `You are receiving this because you have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `${resetURL}\n\n` ,
    };
  
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Password reset email sent.");
      }
    });
  }

router.post("/signup",
    body('name',"enter a valid name").isLength({min:3}),
    body('email',"enter a valid email").notEmpty().isEmail(),
    body('password',"enter a valid password").isLength({min:5}),
    async(req,res)=>{
        let success=false;
        try {
          const result = validationResult(req);
        if (result.isEmpty()) {
          const salt = await bcrypt.genSalt(10)
          const hash = await bcrypt.hashSync(req.body.password, salt)
          const user = new User({
            name:req.body.name,
            email:req.body.email,
            password:hash,
          });
          const data = {
            user:{
              id: user.id
            }
          }
          const authToken = jwt.sign(data,JWT_SECRET)
          await user.save();
          success=true;
          res.json({success,authToken})
          console.log('User created successfully');
        }
        else{
          res.send({ "validation errors": result.array() });
        }
        } catch (error) {
          if (error.message.includes('duplicate key error')) {
            console.error('Duplicate key error:', error);
            res.status(400).json({success,error: "Email already exists" });}
             else {
            console.error('Error creating user:', error);
            res.status(500).json({success, error: "Internal server error"});
          }
        }
})

router.post("/login",[
    body('email',"enter a valid email").isEmail(),
    body('password',"password can't be blank").exists()
  ], async (req, res) => {
    let success=false;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({error:"Enter right credentials"})
    }
    const {email,password} = req.body;
    try {
      let user = await User.findOne({email});
      if(!user){
        return res.status(400).json({error:"Enter proper credentials"})
      }
      const passwordCompare = await bcrypt.compare(password,user.password)
      if(!passwordCompare){
        return res.status(400).json({success,error:"Enter proper credentials"})
      }
      const data = {
        user:{
          id: user.id
        }
      }
      const authToken = jwt.sign(data,JWT_SECRET)
      success=true;
      res.json({success,authToken});
      console.log("login successful with authToken "+authToken.slice(0,10)+"...")
      console.log("Welcome "+user.name)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
  })

router.post("/forgot_password", [
    body("email", "Enter a valid email").isEmail(),
  ], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ error: "Enter a valid email" });
    }
  
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      const resetToken = generateResetToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordTokenExpires = Date.now() + 3600000; 
      await user.save();
  
      sendResetEmail(user, resetToken);
  
      res.json({ success: true, message: "Password reset email sent" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  });
  
  router.post("/reset_password/:token", [
    body("password", "Enter a valid password").isLength({ min: 5 }),
  ], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ error: "Enter a valid password" });
    }
  
    const { token } = req.params;
    const { password } = req.body;
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ error: "Token is invalid or expired" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
  
      user.password = hash;
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpires = undefined;
  
      await user.save();
  
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  });

module.exports=router;