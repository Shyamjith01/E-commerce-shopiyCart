
//close
function changeQuantity(cartId, proId, userId, count) {
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)
    console.log(count)
    $.ajax({
        url: '/change-product-quantity',
        data: {
            user: userId,
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',

        success: (response) => {
            if (response.removeProduct) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })
                Toast.fire({
                    icon: 'warning',
                    title: 'product removed from the cart'
                })
            } else {
                console.log(response, "response****")
                document.getElementById(proId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.sum
            }

        }


    })
}

function deleteCartPro(cartId, proId) {

    $.ajax({
        url: '/delete-cart-product',
        data: {
            cart: cartId,
            product: proId
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {

            } else {
                alert("Cart product has removed")
            }
        }
    })
    location.reload()
}





var inputs = document.querySelectorAll('.pro_file-input')

for (var i = 0, len = inputs.length; i < len; i++) {
    customInput(inputs[i])
}

function customInput(el) {
    const fileInput = el.querySelector('[type="file"]')
    const label = el.querySelector('[data-js-label]')

    fileInput.onchange =
        fileInput.onmouseout = function () {
            if (!fileInput.value) return

            var value = fileInput.value.replace(/^.*[\\\/]/, '')
            el.className += ' -chosen'
            label.innerText = value
        }
}




