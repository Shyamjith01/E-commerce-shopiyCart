

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
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the previous step
        "handler": function (response) {

            console.log(response, order)
            verifyPayment(response, order);
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
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
    var x = document.getElementById("snackbar")

    x.className = "show"

    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}




//delte order 
function deleteOrder(id) {
    console.log("inside of function")
    $.ajax({
        url: '/delete_order',
        data: {
            OrderId: id
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                console.log("response")


                setTimeout(function(){
                    location.reload()
                },2800)
                sample()


            }
        }
    })
}