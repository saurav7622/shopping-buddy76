const mongoose=require('mongoose');
const dotenv=require('dotenv');
const app=require('./app');

dotenv.config({path:'./config.env'});
const port=process.env.PORT||3000;

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    
}).then(con=>{
   //console.log(con.connections);
    console.log('DB connection successfull');
});

app.listen(port,()=>{
    console.log(`App running on port ${port}`);
});

process.on('unhandledRejection',err=>{
    console.log('Unhandled Rejection! Shutting down gracefully!!');
    console.log(err.name,err.message);
    server.close(()=>{
        process.exit(1);
    });

});

process.on('SIGTERM',()=>{
    console.log('SIGTERM received!Shutting down gracefully!!');
    server.close(()=>{
        console.log('Process terminated gracefully');
    });
});

