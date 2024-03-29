const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const jwt_decode = require("jwt-decode");
const request = require("request-promise");
const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

dotenv.config({ path: "./../config.env" });
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
const CLIENT_ID =
  "117776170150-abcqbitk6fvgg657ngqi6p4l9e58dg61.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04aL3UL4Mts3VCgYIARAAGAQSNwF-L9IrV22H9FRj_zIOiecSw8dFdAqdO61cBWC5cEjuNn-l3fLQ1ME9pKc5C-F3Aqj2aHIN2Ts";
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const triggerFreshEmail = catchAsync(async (user, arr, current_price) => {
  let product_name;
  if (arr.url.split(".")[1] == "herokuapp") product_name = "demo-product";
  else if (
    arr.url.split(".")[1] == "flipkart" ||
    arr.url.split(".")[1] == "amazon"
  )
    product_name = arr.url.split("/")[3];
  else if (arr.url.split(".")[1] == "snapdeal")
    product_name = arr.url.split("/")[4];
  const accessToken = await oAuth2Client.getAccessToken();
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "shoppingbuddy76@gmail.com",
      //pass: process.env.EMAIL_PASSWORD,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });
  let mailOptions = {
    from: "shoppingbuddy76@gmail.com",
    to: user.email,
    subject: "Your Product Price Status",
    html: `<img src="${arr.productPicture}">
               <p>Hye ${user.name.split(" ")[0]},</p>
               <p>The price of your product (<span style="color:green"><a style="color:green" href="${
                 arr.url
               }">${arr.productName}</a></span>) chosen at ${
      arr.url.split(".")[1]
    } get saved at <span style="color:orange"> Rs ${arr.price}</span></p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
});
const triggerEmail = catchAsync(async (data, current_price, image_source) => {
  let product_name;
  if (data.url.split(".")[1] == "herokuapp") product_name = "demo-product";
  else if (
    data.url.split(".")[1] == "flipkart" ||
    data.url.split(".")[1] == "amazon"
  )
    product_name = data.url.split("/")[3];
  else if (data.url.split(".")[1] == "snapdeal")
    product_name = data.url.split("/")[4];
  const accessToken = await oAuth2Client.getAccessToken();
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "shoppingbuddy76@gmail.com",
      //pass: process.env.EMAIL_PASSWORD,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });
  let mailOptions = {
    from: "shoppingbuddy76@gmail.com",
    to: data.obj.email,
    subject: "Your Product Price Status",
    html: `<img src="${image_source}">
               <p>Hye ${data.obj.name.split(" ")[0]},</p>
               <p>The price of your product (<span style="color:green"><a style="color:green" href="${
                 data.url
               }">${product_name}</a></span>) chosen at ${
      (image_source, data.url.split(".")[1])
    } changed to <span style="color:orange">${current_price}</span></p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
  const user = await User.findOne({ email: data.obj.email });
  //console.log(req.body.index);
  user.notifications[data.index].price = current_price.split(" ")[1] * 1;
  //console.log(typeof(current_price.split(" ")[1]*1));
  const updated_User = await user.save({ validateBeforeSave: false });
  //console.log(updated_User);
});
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, req, res);
});
exports.addNotifications = catchAsync(async (req, res, next) => {
  let token = req.cookies.jwt;
  var decodedPayload = jwt_decode(token, { payload: true });
  //Check if user _id exists
  if (!decodedPayload.id) {
    return next(new AppError("Sorry!You are not authenticated!!"));
  }
  //Check if any user with the detected id exists
  const user = await User.findOne({ _id: decodedPayload.id });
  const domain_name = req.body.url.split(".")[1];
  if (!user)
    return next(new AppError("No such user with the detected _id exists"));
  //console.log(user.notifications);
  let NOTIFICATION = await user.notifications.find(
    (obj) => obj.url === req.body.url
  );
  if (NOTIFICATION) {
    await user.notifications.updateOne(
      {
        url: req.body.url,
      },
      {
        $set: { duration: req.body.duration },
      }
    );
  } else {
    let product_name;
    let current_price;
    let image_source;
    let img;
    let Price;
    if (req.body.url.split(".")[1] == "herokuapp")
      product_name = "demo-product";
    else if (
      req.body.url.split(".")[1] == "flipkart" ||
      req.body.url.split(".")[1] == "amazon"
    )
      product_name = req.body.url.split("/")[3];
    else if (req.body.url.split(".")[1] == "snapdeal")
      product_name = req.body.url.split("/")[4];

    if (
      domain_name == "snapdeal" ||
      domain_name == "flipkart" ||
      domain_name == "herokuapp"
    ) {
      const html = await axios({
        method: "GET",
        url: req.body.url,
      });
      // console.log(html);

      const $ = cheerio.load(html.data);
      if (domain_name == "herokuapp") {
        current_price = $(".myprice").html();
        image_source =
          "https://image.freepik.com/free-psd/paper-box-mockup_35913-1372.jpg";
        // console.log(current_price);
        if (!current_price)
          return next(
            newAppError("Please make sure you added the url of product page!!")
          );
        Price = current_price.split(" ")[1];
      } else if (domain_name == "flipkart") {
        current_price = $("._16Jk6d").html();
        if (!current_price)
          return next(
            newAppError("Please make sure you added the url of product page!!")
          );
        // console.log(current_price);
        img = $('div[class="_1iyjIJ"]').html();
        //console.log(img);
        image_source = img.split("background-image:url(")[1].split(")")[0];
        //console.log(image_source);
        let ar = current_price.split("");
        //console.log(ar[0]);
        ar.splice(0, 1);

        ar.forEach((el, index) => {
          if (el == ",") ar.splice(index, 1);
        });
        Price = ar.join("");
        // console.log(ar.join(''));
      } else if (domain_name == "snapdeal") {
        current_price = $('span[class="payBlkBig"]').html();
        img = $('ul[id="bx-slider-left-image-panel"]>li').html();
        image_source = img.split('"')[9];
        // console.log(image_source);
        // const image_source=img.split('')
        Price = current_price;
      }
    }

    let arr = {
      url: req.body.url,
      duration: req.body.duration,
      productCompany: domain_name,
      productPicture: image_source,
      productName: product_name,
      price: Price * 1,
      timeStamp: String(Date.now()),
    };
    if (!arr.url) return next(newAppError("Please provide the url"));
    if (
      domain_name != "snapdeal" &&
      domain_name != "herokuapp" &&
      domain_name != "flipkart"
    )
      return next(newAppError("Please provide the correct url"));
    await user.notifications.push(arr);
    user.save({ validateBeforeSave: false });
    await triggerFreshEmail(user, arr, `Rs ${Price}`);
    // console.log(user.notifications);
  }
  next();
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  //Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  //console.log(user);
  //If everything ok,send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
exports.protect = catchAsync(async (req, res, next) => {
  //Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError("You are not logged in!Please log in to get access.", 401)
    );

  //VERIFICATION PROCESS
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //CHECK IF USER STILL EXISTS
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("The user belonging to the token no longer exists!", 401)
    );
  }
  //Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password.Please log in again!", 401)
    );
  }
  //Grant access to the protected route
  req.user = freshUser;
  next();
});
exports.isLoggedIn = async (req, res, next) => {
  //1)Verify token

  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //console.log(decoded);

      //CHECK IF USER STILL EXISTS
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //Check if user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // There is an logged in user
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this operation",
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //  Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  //Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  //Send it to users email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetPassword/${resetToken}`;
  const message = `Forgot your password?Submit a patch request with your new password and passwordConfirm to
     ${resetURL}.\nIf you didnt forget your password,please ignore this email.`;

  const accessToken = await oAuth2Client.getAccessToken();
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      //pass: process.env.EMAIL_PASSWORD,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });
  let mailOptions = {
    from: "shoppingbuddy76@gmail.com",
    to: req.body.email,
    subject: "Email Verification Message",
    html: message,
  };

  await transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      return next(
        new AppError("There was an error sending this email.Try again later!")
      );
    } else {
      console.log(
        "Email has been sent!! Kindly activate your account within 10 minutes."
      );
      res.status(200).json({
        status: "success",
        data: "sucess",
      });
    }
  });
  // console.log(user.passwordResetToken);
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on the token
  //console.log(req.params.token);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token.split(":")[1])
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //console.log(user.passwordResetToken)
  //2)If token has not expired and there is user,set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3)Update changedPasswordAt property for the user
  // 4)Log the user in,send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  //console.log("hyerehyerehyere");
  //console.log(req.user);
  let token = req.cookies.jwt;
  var decodedPayload = jwt_decode(token, { payload: true });
  // console.log("hyerehyerehyere");
  // console.log(decodedPayload.id);
  const user = await User.findById(decodedPayload.id).select("+password");
  //2)Check if posted current password is correct
  //console.log(req.body);
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  //3)If so,update passwod
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newConfirmPassword;
  await user.save();
  createSendToken(user, 200, req, res);
});

const trackPriceFromBackend = catchAsync(async (data) => {
  // console.log(Date.now());
  // console.log(Date.parse(req.body.ob.createdAt))
  if (
    Date.now() >=
    Date.parse(data.ob.createdAt) + data.ob.duration * 24 * 60 * 60 * 1000
  ) {
    data.obj.notifications.splice(data.index, 1);
    const user = await User.findById(data.obj._id);
    user.notifications.splice(data.index, 1);
    await user.save({ validateBeforeSave: false });
  }
  const domain_name = data.url.split(".")[1];
  //console.log(domain_name);
  if (
    domain_name == "snapdeal" ||
    domain_name == "flipkart" ||
    domain_name == "herokuapp"
  ) {
    const html = await axios({
      method: "GET",
      url: data.url,
    });

    //console.log("errorrrrrrrrrrrrrr");
    const $ = cheerio.load(html.data);
    if (domain_name == "herokuapp") {
      const current_price = $(".myprice").html();
      const image_source =
        "https://image.freepik.com/free-psd/paper-box-mockup_35913-1372.jpg";
      // console.log(current_price);
      if (!current_price)
        return next(
          newAppError("Please make sure you added the url of product page!!")
        );
      if (current_price.split(" ")[1] * 1 != data.price) {
        triggerEmail(data, current_price, image_source);
      }
    } else if (domain_name == "flipkart") {
      const current_price = $("._16Jk6d").html();
      if (!current_price)
        return next(
          newAppError("Please make sure you added the url of product page!!")
        );
      // console.log(current_price);
      let img = $('div[class="_1iyjIJ"]').html();
      //console.log(img);
      const image_source = img.split("background-image:url(")[1].split(")")[0];
      //console.log(image_source);
      let ar = current_price.split("");
      //console.log(ar[0]);
      ar.splice(0, 1);

      ar.forEach((el, index) => {
        if (el == ",") ar.splice(index, 1);
      });
      // console.log(ar.join(''));
      if (ar.join("") * 1 != data.price) {
        triggerEmail(data, `Rs ${ar.join("")}`, image_source);
      }
    } else if (domain_name == "snapdeal") {
      const current_price = $('span[class="payBlkBig"]').html();
      const img = $('ul[id="bx-slider-left-image-panel"]>li').html();
      const image_source = img.split('"')[9];
      // console.log(image_source);
      // const image_source=img.split('')

      if (current_price * 1 != data.price) {
        triggerEmail(data, `Rs ${current_price}`, image_source);
      }
    }
  }
});
const triggerNotificationsFromBackend = async () => {
  try {
    const users = await User.find();

    users.forEach((obj) => {
      obj.notifications.forEach(async (ob, index) => {
        try {
          let data = {
            url: ob.url,
            price: ob.price,
            obj,
            ob,
            index,
          };

          await trackPriceFromBackend(data);
        } catch (err) {
          console.log(err);
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
};
//console.log("hye");
//setTimeout(triggerNotifications,3000)
setInterval(triggerNotificationsFromBackend, 10 * 60 * 1000);
