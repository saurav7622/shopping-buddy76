const path=require('path');
const express=require('express');
const AppError=require('./utils/appError');
const globalErrorHandler=require('./controllers/errorController');
const morgan=require('morgan');
const mongoose=require('mongoose');
const app=express();
const dotenv=require('dotenv');
const viewRouter = require('./routes/viewRoutes');
const cookieParser=require('cookie-parser');
const User=require('./models/userModel');
//const cors=require('cors');
const compression=require('compression');
const request=require('request-promise');
const cheerio=require('cheerio');
const axios=require("axios");
dotenv.config({path:'./config.env'});
app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  //app.use(cors());
  app.use(compression());
const userRouter=require('./routes/userRoutes');
//1.MIDDLEWARES
app.use(morgan('dev'));
app.use(express.json({limit:'10kb'}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    console.log(req.cookies);
    console.log("hye...........");
    
     
    
    

    next();
});

app.use('/',viewRouter);
app.use('/api/v1',userRouter);

//Triggering Notifications

/*const corsOpt = {
  origin: '*', // this work well to configure origin url in the server
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'], // to works well with web app, OPTIONS is required
  allowedHeaders: ['Origin','X-Requested-With','Accept','Content-Type', 'Authorization'] // allow json and token in the headers
};

app.use(Cors(corsOpt));*/
/*app.use(
	cors({
		origin:'https://www.flipkart.com/lenovo-core-i5-9th-gen-8-gb-1-tb-hdd-windows-10-home-3-gb-graphics-nvidia-geforce-gtx-1050-l340-15irh-gaming-laptop/p/itm3dccf41ac3879?pid=COMGFJQFY5ZPGUZV&lid=LSTCOMGFJQFY5ZPGUZVOVDFAP&marketplace=FLIPKART&store=6bo%2Fb5g&srno=b_1_1&otracker=dynamic_omu_infinite_Best%2BDeals%2Bon%2BLaptops_2_1.dealCard.OMU_INFINITE_N4GTRPXR72GK&fm=neo%2Fmerchandising&iid=en_wbG3XMAXFlIxL%2BFLza92iiLgThYfJG3gE3yQ3d6tcUg3%2F9F0QQz2cwSJKrt7SpDX5StpN6a9FYaytPZLaqxlSQ%3D%3D&ppt=dynamic&ppn=dynamic&ssid=hhc12bkwcg0000001623527205024',
	})
);*/
//console.log("hye");
//console.log(process.env.DATABASE_PASSWORD);
app.all('*',(req,res,next)=>{
  
   /* const err=new Error(`Cant find ${req.originalUrl} on this server!`);
    err.status='fail';
    err.statusCode=404;*/

    next(new AppError(`Cant find ${req.originalUrl} on this server!`,404));
});

app.use(globalErrorHandler);

 module.exports=app;

