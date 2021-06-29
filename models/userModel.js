const crypto=require('crypto');
const mongoose=require('mongoose');
const validator=require('validator');
const slugify=require('slugify');
const bcrypt=require('bcryptjs');
const jwt=require("jsonwebtoken");
const nodemailer=require('nodemailer');

//name,email,photo,password,passwordConfirm
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell us your name'],
        trim:true
    },
    email:{
     type:String,
     required:[true,'Please provide your email'],
     unique:true,
     lowercase:true,
     validator:[validator.isEmail,' Please provide a valid email']
    },
    photo:String,
    notifications:[
      {
        url:{
          type:String,
          default:'https://www.google.com'
        },
        duration:{
          type:Number,
          default:30
        },
        price:{
          type:Number,
          default:-10
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        productPicture:{
          type:String,
        },
        productCompany:{
          type:String,
        },
        productName:{
          type:String
        }

      }
    ],
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            validator:function(el){
                return el===this.password;
            },
            message:"Passwords are not the same!"
        }
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }

});
userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();
  
    
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
  });
  
  userSchema.pre('save', function(next) {
    
    if (!this.isModified('password') || this.isNew) return next();
  
    
    this.passwordChangedAt = Date.now() - 1000;
    next();
  });
  
  userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
  });
  
  userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };
  
  userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return JWTTimestamp < changedTimestamp;
    }
  
    // False means NOT changed
    return false;
  };
  
  userSchema.methods.createPasswordResetToken =  function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    //console.log("createPasswordResetToken");
  //console.log(this);
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  
    //console.log({ resetToken }, this.passwordResetToken);
  
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
     this.save({validateBeforeSave:false});
 // console.log(this)
    return resetToken;
  };
  
  const User = mongoose.model('User', userSchema);
  
  module.exports = User;
  