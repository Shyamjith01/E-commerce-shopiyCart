$(document).ready(function(){
    $('#loginForm').validate({
        rules:{
            number:{
                required:true,
                minlength:10
            },
            password:{
                required:true,
                minlength:4
            }
        }
    })
})