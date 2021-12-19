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
            alert(response)
            console.log(response)
        }
    })
})