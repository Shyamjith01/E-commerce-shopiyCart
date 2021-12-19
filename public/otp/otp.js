var submitflag=true;
$('input[type=submit]').click(function(){
  
    submitflag=true;
    checknullinput();  
   // var useremail = $('input[type=text][name=email]').val();   
   // if(useremail!=''){
      // validateEmail(useremail);
  //  }


function validateEmail(email) {
  var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  if( !emailReg.test( email ) ) {
    $('.errormessage').css("display","block");
    $('input[type=text][name=email]').addClass('alarm');submitflag=false;
    return false;
  } else {
    $('.errormessage').css("display","none");
    $('input[type=text][name=email]').removeClass('alarm');
    return true;
  }
}
  
  function checknullinput(){
    
   // var useremail= $('input[type=text][name=email]')
    var password = $('input[type=password][name=password]');
    password.removeClass("error");//useremail.removeClass("error");
       if(password.val()==''){  password.focus(); password.addClass("error"); submitflag=false; }    
     //  if(useremail.val()==''){ useremail.focus(); useremail.addClass("error"); submitflag=false; } 
           
  }
  
  if(submitflag==false){
     return false; 
  }else{
    alert("submit succesful, thank you!"); 
  }
  
  });