import axios from 'axios';

export const saveForgotPassword=async(newPassword,confirmPassword,token)=>
{

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
            method:'PATCH',
            url:`/api/v1/resetPassword/:${token}`,
            data:
            {
            newPassword,
            confirmPassword
            }
        });
        if(res.data.status=='success')
        {
            showAlert('success',"Your account get updated with new password!!");
            window.setTimeout(()=>{
                location.assign('/')
            },1500);
        }
    }catch(err)
    {
        showAlert('error',err.response.data.message);
    }

}