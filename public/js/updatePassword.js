import axios from 'axios';

export const resetPassword=async(currentPassword,newPassword,newConfirmPassword)=>{
    alert(currentPassword);
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
            method:'PATCH',
            url:'http://127.0.0.1:3000/api/v1/updateMyPassword',
            data:
            {
            currentPassword,
            newPassword,
            newConfirmPassword
            }
        });
        if(res.data.status=='success')
        {
            showAlert('success','Password updated successfully');
        }
    }catch(err)
    {
        showAlert('error',err.response.data.message);
    }
}