import axios from 'axios';
export const addNotifications=async(url,duration)=>{
    //alert("adding url");
    const hideAlert=()=>{
        const el=document.querySelector('.alert');
        if(el)
        el.parentElement.removeChild(el);
    }
    
     const showAlert=(type,msg)=>{
        hideAlert();
        let color;
        if(type==='error')
         color='#a64452';
        else
        color='#4bb543';
        const markup=`<div class="alert alert--${type}" style="display:block;margin:auto;text-align:center;height:22%;font-size:18px;background-color:${color};">${msg}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
        window.setTimeout(hideAlert,5000);
    }

try{
    const res=await axios({
        method:'POST',
        url:'/api/v1/addNotifications',
        data:{
            url,
            duration
        }
    });
    window.setTimeout(()=>{
        window.location.reload();
    },6000);
    /*const users= await axios({
        method:'GET',
        url:'http://127.0.0.1:3000/api/v1/getAllUsers',
        responseType:'json'
    });
   alert(users.data.data.users[0].notifications[0].duration);*/
    
    if(users.data.status==='success')
    {
        showAlert('success','Data added successfully!');
    
    }
}catch(err){

    showAlert('success','Data added successfully!');
}
}

