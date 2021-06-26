import * as cheerio from 'cheerio';
import * as request from 'request-promise';
import axios from 'axios';

export const AddNotifications=async()=>{
    try{
    
        const users= await axios({
            method:'GET',
            url:'http://127.0.0.1:3000/api/v1/getAllUsers',
            responseType:'json'
        });
        
    
        const URL='https://demo-server21.herokuapp.com/';
        users.data.data.users.forEach(obj=>{
          obj.notifications.forEach(async(ob,index)=>{
            try{
       const res=await axios({
          method:'POST',
          url:'http://127.0.0.1:3000/api/v1/trackPrice',
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
      //console.log(err);
    }
    });
  });
       
       //console.log(users.data.data.users);
     // users.data.data.users.forEach(obj=>{
        
       //   obj.notifications.forEach(ob=>{
            
        /*const html= await Nightmare.goto(
             'https://www.flipkart.com/lenovo-core-i5-9th-gen-8-gb-1-tb-hdd-windows-10-home-3-gb-graphics-nvidia-geforce-gtx-1050-l340-15irh-gaming-laptop/p/itm3dccf41ac3879?pid=COMGFJQFY5ZPGUZV&lid=LSTCOMGFJQFY5ZPGUZVOVDFAP&marketplace=FLIPKART&store=6bo%2Fb5g&srno=b_1_1&otracker=dynamic_omu_infinite_Best%2BDeals%2Bon%2BLaptops_2_1.dealCard.OMU_INFINITE_N4GTRPXR72GK&fm=neo%2Fmerchandising&iid=en_wbG3XMAXFlIxL%2BFLza92iiLgThYfJG3gE3yQ3d6tcUg3%2F9F0QQz2cwSJKrt7SpDX5StpN6a9FYaytPZLaqxlSQ%3D%3D&ppt=dynamic&ppn=dynamic&ssid=hhc12bkwcg0000001623527205024')
             .wait('._16Jk6d')
             .evaluate(()=>
              document.querySelector("._16Jk6d")
              .innerText)
              .end();*/
         
          //})
     // }) 
       
    }catch(err){
    //console.log(err);
        
    }
    }

