
//close
    function changeQuantity(cartId,proId,userId,count){
        let quantity = parseInt(document.getElementById(proId).innerHTML)
        count=parseInt(count)
        console.log(count)
        $.ajax({
            url:'/change-product-quantity',
            data:{
                user:userId,
                cart:cartId,
                product:proId,
                count:count,
                quantity:quantity
            },  
            method:'post',
            
            success:(response)=>{
                if(response.removeProduct){
                    alert("product removed from the cart")
                    location.reload()
                }else{
                    console.log(response,"response****")
                    document.getElementById(proId).innerHTML=quantity+count
                    document.getElementById('total').innerHTML=response.sum
                }
                
            }
            
           
        })
    }

    function deleteCartPro(cartId,proId){
        $.ajax({
            url:'/delete-cart-product',
            data:{
                cart:cartId,
                product:proId
            },
            method:'post',
            success:(response)=>{
                if(response.removeProduct){

                }else{
                    alert("Cart product has removed")
                }
            }
        })
        location.reload()
    }
    

    


