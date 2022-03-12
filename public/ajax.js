

console.log("yessss 1122")
$("#checkout-form").submit((e) => {
    console.log("yesssssssssssssss")
    e.preventDefault()
    console.log("yes")
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            if (response.codeSuccess) {
                location.href = '/confirmation'
            } else {
                console.log(response.response, "response")
                razorpayPayment(response.response)
            }

        }
    })
})
function razorpayPayment(order) {
    console.log("inside of razorpayPayment")
    let amount = parseInt(order.amount)
    var options = {

        "key": "rzp_test_l9ArNk5S5XiPRV", // Enter the Key ID generated from the Dashboard
        "amount": amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "shopiyCart",
        "description": "Test Transaction",
        "image": 'https://cdn.wallpapersafari.com/84/0/CkrnbA.jpg',
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the previous step
        "handler": function (response) {

            console.log(response, order)
            verifyPayment(response, order);
        },
        "prefill": {
            "name": "shopiyCart",
            "email": "shopiyCart@gmail.com",
            "contact": "94003263511"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();


}


function verifyPayment(response, order) {
    console.log("inside of of of")
    $.ajax({
        url: '/verify-payment',
        data: {
            response,
            order
        },
        method: 'post',
        success: (response) => {
            console.log(response);
            if (response.status) {
                location.href = '/confirmation'
            } else {
                alert("payment failed")
            }
        }
    })
}


function sample() {
    console.log("inside of sample")
    setTimeout(function () {
        location.reload()
    }, 2800)
}




//delte order 
function deleteOrder(id) {
    $.ajax({
        url: '/delete_order',
        data: {
            OrderId: id
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                console.log("response")
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'order history deleted',
                    showConfirmButton: false,
                    timer: 1500
                }).then((resp) => {
                    if (resp) {
                        location.reload()
                    }
                })






            }
        }
    })

    console.log("inside of function")

}

//adress deletion
function adressDelete(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "are you sure to delete the adress ?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/del_adress/' + id,
                method: 'get',
                success: (response) => {
                    if (response.status) {
                        Swal.fire(
                            'Deleted!',
                            'Your adress has been deleted.',
                            'success'
                        ).then((resp)=>{
                            location.reload()
                        })
                    }
                }
            })
        }
    })
}