import axios from 'axios';

export const forgotPassword=async(email)=>{
    //alert(currentPassword);
    const hideAlert=()=>{
        const el=document.querySelector('.alert');
        if(el)
        el.parentElement.removeChild(el);
    }
    
     const showAlert=(type,msg)=>{
        hideAlert();
        const markup=`<div class="alert alert--${type}">${msg}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
        window.setTimeout(hideAlert,5000);
    }
    try{
        const res=await axios({
            method:'POST',
            url:'/api/v1/forgotPassword',
            data:
            {
            email
            }
        });
        if(res.data.status=='success')
        {
            showAlert('success',"Email has been sent!! Kindly activate your account within 10 minutes.");
        }
    }catch(err)
    {
        showAlert('error',err.response.data.message);
    }
 
}
