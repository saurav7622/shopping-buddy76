const express=require('express');
const path=require('path');
const app=express();
const User=require('./../models/userModel');
app.use(express.static('public'));
app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));

exports.getOverview=(req,res)=>{
    res.status(200).render('overview',{
        title:'Overview page'
    });
};

exports.getLoginForm=(req,res)=>{
    res.status(200).render('login',{
        title:'Log into your account'
    });
};

exports.getSignUpForm=(req,res)=>{
    res.status(200).render('signup',{
        title:'Sign up your account'
    });
}
exports.getResetPasswordForm=(req,res)=>{
    res.status(200).render('resetPassword',{
        title:'Reset your password',
    });
}
exports.getForgotPasswordForm=(req,res)=>{
    res.status(200).render('forgotPassword',{
        title:'Reset your password',
    });
}
exports.getForgottenPasswordResetForm=(req,res)=>{

    res.status(200).render('forgottenPasswordResetForm',{
        title:"Reset your forgotten password"
    });
}