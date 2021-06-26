const crypto=require('crypto');
const {promisify}=require('util');
const jwt=require('jsonwebtoken');
const User=require('./../models/userModel');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const jwt_decode = require('jwt-decode');
const request=require("request-promise");
const cheerio=require("cheerio");
const axios=require('axios');
const dotenv=require('dotenv');
const nodemailer=require('nodemailer');

dotenv.config({path:'./../config.env'});
const signToken=id=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
const triggerEmail=catchAsync(async(req,current_price,image_source)=>{
    let product_name;
    if(req.body.url.split(".")[1]=="herokuapp")
    product_name="demo-product";
    else if(req.body.url.split(".")[1]=="flipkart"||req.body.url.split(".")[1]=="amazon")
    product_name=req.body.url.split("/")[3];
    else if(req.body.url.split(".")[1]=="snapdeal")
    product_name=req.body.url.split("/")[4];
    let transporter=nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:process.env.EMAIL,
            pass:process.env.EMAIL_PASSWORD
        }
    });
    let mailOptions={
        from:'shoppingbuddy76@gmail.com',
        to:req.body.obj.email,
        subject:'Your Product Price Status',
        html:`<img src="${image_source}">
               <p>Hye ${req.body.obj.name.split(" ")[0]},</p>
               <p>The price of your product (<span style="color:green">${product_name}</span>) chosen at ${image_source,req.body.url.split(".")[1]} changed to <span style="color:orange">${current_price}</span></p>`
    }
    transporter.sendMail(mailOptions,function(err,data){
        if(err)
        {
            console.log('Error occurs');
        }
        else
        {
            console.log("Email sent!!");
        }
    });
    const user=await User.findOne({email:req.body.obj.email});
    //console.log(req.body.index);
    user.notifications[req.body.index].price=current_price.split(" ")[1]*1;
    //console.log(typeof(current_price.split(" ")[1]*1));
    const updated_User=await user.save({validateBeforeSave:false});
    //console.log(updated_User);
});
exports.signup = catchAsync(async (req, res, next) => {
   
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  createSendToken(newUser, 201, res);
});
exports.addNotifications=catchAsync(async(req,res,next)=>{
    let token=req.cookies.jwt;
    var decodedPayload = jwt_decode(token, { payload: true });

    //Check if user _id exists
    if(!decodedPayload.id)
    {
        return next(new AppError('Sorry!You are not authenticated!!'));
    }
    //Check if any user with the detected id exists
    const user=await User.findOne({_id:decodedPayload.id});
    
    if(!user)
    return next(new AppError('No such user with the detected _id exists'));
    //console.log(user.notifications);
     let NOTIFICATION=await user.notifications.find(obj=>obj.url===req.body.url);
     if(NOTIFICATION)
     {
         await user.notifications.updateOne({
             url:req.body.url
         },
         {
             $set:{duration:req.body.duration}
         })
     }
     else{
        let arr={
            url:req.body.url,
            duration:req.body.duration,
            price:-10
        };
        await user.notifications.push(arr);
        await user.save({validateBeforeSave:false});
       // console.log(user.notifications);
     }
    next();
});
exports.trackPrice=catchAsync(async(req,res,next)=>{
   // console.log(Date.now());
   // console.log(Date.parse(req.body.ob.createdAt))
    if(Date.now()>=Date.parse(req.body.ob.createdAt)+req.body.ob.duration*24*60*60*1000)
    {
    req.body.obj.notifications.splice(req.body.index,1);
    const user=await User.findById(req.body.obj._id);
    user.notifications.splice(req.body.index,1);
    await user.save({validateBeforeSave:false});
    }
    const domain_name=req.body.url.split(".")[1];
    //console.log(domain_name);
    if(domain_name=="snapdeal"||domain_name=="flipkart"||domain_name=="herokuapp")
    {
    const html=await axios({
        method:"GET",
        url:req.body.url,
    });
   // console.log(html);

    const $=cheerio.load(html.data);
    if(domain_name=="herokuapp")
    {
    const current_price=$(".myprice").html();
    const image_source='https://image.freepik.com/free-psd/paper-box-mockup_35913-1372.jpg';
   // console.log(current_price);
   if(!current_price)
   return next(newAppError('Please make sure you added the url of product page!!'));
    if(current_price.split(" ")[1]*1!=req.body.price)
    {
        /*let transporter=nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:process.env.EMAIL,
                pass:process.env.EMAIL_PASSWORD
            }
        });
        let mailOptions={
            from:'agarwalsonu6276@gmail.com',
            to:req.body.obj.email,
            subject:'Your Product Price Status',
            text:`Price changed to ${current_price}`
        }
        transporter.sendMail(mailOptions,function(err,data){
            if(err)
            {
                console.log('Error occurs');
            }
            else
            {
                console.log("Email sent!!");
            }
        });
        const user=await User.findOne({email:req.body.obj.email});
        console.log(req.body.index);
        user.notifications[req.body.index].price=current_price.split(" ")[1]*1;
        console.log(typeof(current_price.split(" ")[1]*1));
        const updated_User=await user.save({validateBeforeSave:false});
        console.log(updated_User);*/
       
        triggerEmail(req,current_price,image_source);
    }
    }
    else if(domain_name=="flipkart")
    {
        const current_price=$("._16Jk6d").html();
        if(!current_price)
        return next(newAppError('Please make sure you added the url of product page!!'));
       // console.log(current_price);
        let img=$('div[class="_1iyjIJ"]').html();
        //console.log(img);
        const image_source=img.split('background-image:url(')[1].split(")")[0];
        //console.log(image_source);
        let ar = current_price.split('');
        //console.log(ar[0]);
        ar.splice(0,1);
        
        ar.forEach((el,index)=>{
            if(el==',')
            ar.splice(index,1);
        });
       // console.log(ar.join(''));
        if(ar.join('')*1!=req.body.price)
        {
            triggerEmail(req,`Rs ${ar.join('')}`,image_source);
        }
    }
    else if(domain_name=="snapdeal")
    {
       const current_price=$('span[class="payBlkBig"]').html();
       const img=$('ul[id="bx-slider-left-image-panel"]>li').html();
       const image_source=img.split('"')[9];
      // console.log(image_source);
      // const image_source=img.split('')
    
       if(current_price*1!=req.body.price)
       {
           triggerEmail(req,`Rs ${current_price}`,image_source);
       }
    }
}
  
    /*else if(domain_name=='amazon')
    {
        
       const current_price=await nightmare.goto(req.body.url)
                                        .wait("#priceblock_ourprice")
                                        .evaluate(()=>document.getElementById("priceblock_ourprice").innerText)
                                        .end();
      console.log(current_price);
    
      if(current_price.split('$')[1]*1!=req.body.price)
        {
            triggerEmail(req,`$ ${current_price.split('$')[1]}`,"null");
        }
    }*/
   next();
})

exports.login=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;

    //Check if email and password exist
    if(!email||!password)
    {
       return next(new AppError('Please provide email and password!',400));
    }
    //Check if user exists and password is correct
    const user=await User.findOne({email}).select('+password');
    if(!user||!await user.correctPassword(password,user.password))
    {
        return next(new AppError('Incorrect email or password',401));
    }
    //console.log(user);
    //If everything ok,send token to client
    createSendToken(user,200,res);
});


exports.logout=(req,res)=>{
  res.cookie('jwt','loggedout',{
    expires: new Date(Date.now()+10*1000),
    httpOnly:true
  });
  res.status(200).json({status:'success'});
};
exports.protect=catchAsync(async(req,res,next)=>{
    //Getting token and check if its there
    let token;
    if(req.headers.authorization&&req.headers.authorization.startsWith('Bearer'))
    {
        token=req.headers.authorization.split(' ')[1];

    }
    else if(req.cookies.jwt)
    {
        token=req.cookies.jwt;
    }
    if(!token)
    return next(new AppError('You are not logged in!Please log in to get access.',401));

    //VERIFICATION PROCESS
     const decoded=await(promisify(jwt.verify)(token,process.env.JWT_SECRET));
    // console.log(decoded);

     //CHECK IF USER STILL EXISTS
     const freshUser=await User.findById(decoded.id);
     if(!freshUser)
     {
         return next(new AppError('The user belonging to the token no longer exists!',401))
     }
     //Check if user changed password after the token was issued
     if(freshUser.changedPasswordAfter(decoded.iat))
     {
         return next(new AppError('User recently changed password.Please log in again!',401));
     }
     //Grant access to the protected route
     req.user=freshUser;
    next();
});
exports.isLoggedIn=async(req,res,next)=>{
    
    //1)Verify token
    
     if(req.cookies.jwt)
    {
      try{
    const decoded=await(promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET));
     //console.log(decoded);

     //CHECK IF USER STILL EXISTS
     const freshUser=await User.findById(decoded.id);
     if(!freshUser)
     {
         return next();
     }
     //Check if user changed password after the token was issued
     if(freshUser.changedPasswordAfter(decoded.iat))
     {
         return next();
     }
     // There is an logged in user
     res.locals.user=freshUser;
    return next();
    }catch(err){
      return next();
    }
    }
    next();
};
exports.restrictTo=(...roles)=>{
       return (req,res,next)=>{
        
        //console.log(req.user.role);
        if(!roles.includes(req.user.role))
        {
            return next(new AppError('You do not have permission to perform this operation',403));
        }
        next();
    };
};

exports.forgotPassword=catchAsync(async(req,res,next)=>{
    //  Get user based on posted email
    const user=await User.findOne({email:req.body.email});
    if(!user)
    {
        return next(new AppError('There is no user with this email address',404));
    }
    

    //Generate the random reset token
     const resetToken=user.createPasswordResetToken();
     /*user.passwordResetToken=resetToken;
     user.passwordResetExpires=Date.now()+10*60*1000;
     await user.save({validateBeforeSave:false});*/

    //Send it to users email
    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;
    const message=`Forgot your password?Submit a patch request with your new password and passwordConfirm to
     ${resetURL}.\nIf you didnt forget your password,please ignore this email.`;
     
   

        let transporter=nodemailer.createTransport({
          service:'gmail',
          auth:{
              user:process.env.EMAIL,
              pass:process.env.EMAIL_PASSWORD
          }
      });
      let mailOptions={
          from:'shoppingbuddy76@gmail.com',
          to:req.body.email,
          subject:'Email Verification Message',
          html:message
      }
      
      await transporter.sendMail(mailOptions,function(err,data){
          if(err)
          {

            return next(new AppError('There was an error sending this email.Try again later!'));
          }
          else
          {

              console.log("Email has been sent!! Kindly activate your account within 10 minutes.");
              res.status(200).json({
                status: 'success',
                data:'sucess'
          });
        }
      });
     // console.log(user.passwordResetToken);

         
    
         
     
    
});
exports.resetPassword=catchAsync(async(req,res,next)=>{
//1)Get user based on the token
//console.log(req.params.token);
const hashedToken=crypto.createHash('sha256').update(req.params.token.split(':')[1]).digest('hex');


const user=await User.findOne({passwordResetToken: hashedToken,
    passwordResetExpires:{$gt:Date.now()}});

//console.log(user.passwordResetToken)
    //2)If token has not expired and there is user,set the new password
    if(!user)
    {
        return next(new AppError('Token is invalid or has expired',400));
    }
    user.password=req.body.newPassword;
    user.passwordConfirm=req.body.confirmPassword;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();
    // 3)Update changedPasswordAt property for the user
    // 4)Log the user in,send JWT
    createSendToken(user,200,res);
    
});

exports.updatePassword=catchAsync(async(req,res,next)=>{
    //1)Get user from collection
    //console.log("hyerehyerehyere");
    //console.log(req.user);
    let token=req.cookies.jwt;
    var decodedPayload = jwt_decode(token, { payload: true });
   // console.log("hyerehyerehyere");
   // console.log(decodedPayload.id);
    const user=await User.findById(decodedPayload.id).select('+password');
    //2)Check if posted current password is correct
    //console.log(req.body);
    if(!(await user.correctPassword(req.body.currentPassword,user.password)))
    {
        return next(new AppError('Your current password is wrong',401));
    }

    //3)If so,update passwod
    user.password=req.body.newPassword;
    user.passwordConfirm=req.body.newConfirmPassword;
    await user.save();
    createSendToken(user, 200, res);
});

 const triggerNotifications=async()=>{
    try{
    
        const users= await axios({
            method:'GET',
            url:'/api/v1/getAllUsers',
            responseType:'json'
        });
       // console.log(users);
    
        const URL='https://demo-server21.herokuapp.com/';
        users.data.data.users.forEach(obj=>{
          obj.notifications.forEach(async(ob,index)=>{
            try{
       const res=await axios({
          method:'POST',
          url:'/api/v1/trackPrice',
          data:{
              url:ob.url,
              price:ob.price,
              obj,
              ob,
              index,
          }
      });
    }
    catch(err)
    {
      console.log(err);
    }
    });
  });
}catch(err)
{
    console.log(err);
}
 };
 //setTimeout(triggerNotifications,3000)
setInterval(triggerNotifications,60*1000);


