
import axios from 'axios';
export const login=async(email,password)=>{
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
        const markup=`<div class="alert alert--${type}" style="display:block;margin:auto;text-align:center;height:18%;background-color:${color};">${msg}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
        window.setTimeout(hideAlert,5000);
    }
try{
    const res=await axios({
        method:'POST',
        url:'/api/v1/login',
        data:{
            email,
            password
        }
    });
    if(res.data.status==='success')
    {
        showAlert('success','Logged in successfully!');
        window.setTimeout(()=>{
            location.assign('/')
        },1500);
    }
}catch(err){
    showAlert('error',err.response.data.message);
}
}



