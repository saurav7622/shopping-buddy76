import axios from 'axios';

export const logout=async()=>{
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
            method:'GET',
            url:'http://127.0.0.1:3000/api/v1/logout'
        });
        if((res.data.status='success'))
        location.reload(true);
        window.setTimeout(alert("Logged out successfully!!"),1000);
    }catch(err){
        console.log(err.response);
      showAlert('error','Error logging out! Try again.');
    }
};

