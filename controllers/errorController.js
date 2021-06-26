const AppError=require('./../utils/appError');
const handleCastErrorDB=err=>{
    const message=`Invalid ${err.path}: ${err.value}`;
    return new AppError(message,400);
};
const handleJWTError=err=>new AppError('Invalid token.Please log in again!',401);
const handleJWTExpiredError=err=>new AppError('Your token has expired!',401);
const handleDuplicateFieldsDB=err=>{
    
    const value=err.keyValue.name;
    const message=`Duplicate field value: ${value}.Please use another value!`;
    return new AppError(message,400);
}
const handleValidationErrorDB=err=>{

    const message=`Invalid input data.${err.message}`;
    return new AppError(message,400);
}
const sendErrorDev=(err,res)=>{
    res.status(err.statusCode).json({
        status:err.status,
        error:err,
        stack:err.stack,
        message:err.message
    });
}
const sendErrorProd=(err,res)=>{
    //Operational,trusted error:send message to client
    if(err.isOperational)
    {
    res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    });
    //Programming,or other unknown errors:don't leak error details
   }else{
       //Log errors
       console.error('Error  ',err);
       //Send generic error message
    res.status(500).json({
        status:'Error',
        message:'Something went very wrong'
    });
   }
}
module.exports=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    let str=process.env.NODE_ENV;
    if(process.env.NODE_ENV==='development')
    {
        sendErrorDev(err,res);
    }
    else if(str.startsWith('p'))
    {
        let error={...err};
        console.log(error.name);
        if(error.name==='CastError')
        {
            
        error=handleCastErrorDB(error);
        
        }
        if(error.code===11000)
        error=handleDuplicateFieldsDB(error);
        if(error.name==='ValidationError')
        {
            error=handleValidationErrorDB(err);
        }
        if(error.name==='JsonWebTokenError')
        error=handleJWTError(error);
        if(error.name==='TokenExpiredError')
        error=handleJWTExpiredError(error);
       sendErrorProd(error,res);
    }

};