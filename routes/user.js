
var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
var productHelpers = require('../helpers/product-helpers');
const { PRODUCT_COLLECTION } = require('../config/collections');
const { channel } = require('diagnostics_channel');
const { resolve } = require('path/posix');
const { response } = require('express');
const swal = require('sweetalert');
const { REFUSED } = require('dns');

const Swal = require('sweetalert2')


//twilio   
// const serviceSID = "VAf9de5342bcd37794eca8246858a67a4f"
// const accountSID = "ACbdf529f89533418b5ced0942a8b7e8b0"
// const authTOKEN = "da7cd9eff8816ad16a929302d8ab1c19"
const serviceSID = process.env.serviceSID
const accountSID = process.env.accountSID
const authTOKEN = process.env.authTOKEN
const client = require('twilio')(accountSID, authTOKEN)
console.log("service Id", serviceSID);
console.log(accountSID, "accountSID");




const verifyLogin = async (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {




  let user = req.session.user
  let Suser = req.session.Suser
  let product = await productHelpers.getAllProduct()
  let banners = await productHelpers.getBanner()
  let brands = await userHelpers.getBrands()


  //banner
  let banner1 = await productHelpers.getBanner1()
  let banner2 = await productHelpers.getBanner2()
  let banner3 = await productHelpers.getBanner3()
  let banner4 = await productHelpers.getBanner4()


  //cart Count
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }


  let topOffer = await productHelpers.topDeals()
  res.render('user/index', { userHeader: true, user, product, banner1, banner2, banner3, banner4, Suser, home: true, cartCount, brands, topOffer })
  // offers
  let todayDate = new Date().toISOString().slice(0, 10);
  let startCatOffer = await adminHelpers.startCategoryOffer(todayDate)
  let startProductOffer = await adminHelpers.startProductOffer(todayDate)
  let startCoupon = await adminHelpers.startCouponOffers(todayDate)

});



router.get('/login', function (req, res) {


  let user = req.session.user
  loginErr = req.session.loggedInErr

  res.render('user/login', { userHeader: true, user, loginErr })
  req.session.loggedInErr = false

})

router.get('/signup', (req, res) => {
  let user = req.session.user
  let numberExist = req.session.numberExist
  res.render('user/signup', { userHeader: true, user: true, user, numberExist });
  req.session.numberExist = false
})



router.post('/login', (req, res) => {

  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loggedInErr = true
      res.redirect('/login')
    }
  })


})

router.post('/signup', (req, res) => {
  let number = req.body.number
  userHelpers.getUserDetails(number).then((user) => {
    if (user) {
      req.session.numberExist = true
      res.redirect('/signup')
    } else {
      userHelpers.doSignup(req.body).then((response) => {
        req.session.Suser = response.user
        req.session.loggedIn = true
        res.redirect('/');
      })
    }
  })


})


router.get('/contact', async (req, res) => {
  let brands = await userHelpers.getBrands()
  let user = req.session.user
  res.render('user/contact', { userHeader: true, brands, user: true, contact: true, user });
})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

router.post('/loginOtp', (req, res) => {

  req.session.number = req.body.number
  userHelpers.getUserDetails(req.body.number).then((user) => {
    if (user) {


      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.session.number}`,
          channel: "sms"
        }).then((response) => {


          res.status(200).json({ response })
        }).catch((err) => {
          if (err.code == 60200) {
            req.session.invalidOtp = true

            res.redirect('/forgetPassword')
          } else if (err.code == 60203) {
            req.session.maxOtp = true
            res.redirect('/forgetPassword')
          }
          res.status(404).json({ errors });

          res.redirect('/otpForm')
          req.session.otpErr = true
        })
      res.redirect('/otp')
    } else {
      req.session.noUser = true

      res.redirect('/otpForm')

    }
  })
  // res.render('user/otp', { userHeader: true })
})


router.get('/otpForm', (req, res) => {

  let noUser = req.session.noUser;
  let permissionDen = req.session.permissionDen
  res.render('user/otpform', { userHeader: true, noUser, permissionDen })
  req.session.permissionDen = false
  req.session.noUser = false
})
//otp submision in login
router.get('/otp', (req, res) => {

  let errOtp = req.session.errOtp

  res.render('user/otp', { userHeader: true, errOtp })
  req.session.errOtp = false
})

router.post('/otp', (req, res) => {
  let number = req.session.number
  const { otp } = req.body

  client.verify.services(serviceSID)
    .verificationChecks
    .create({
      to: `+91${number}`,
      code: otp
    })

    .then((response) => {

      if (response.valid) {
        userHelpers.getUserDetails(number).then((user) => {
          req.session.user = user
          req.session.loggedIn = true
          res.redirect('/')
        })
      } else {
        req.session.errOtp = true
        res.redirect('/otp')
      }
    }).catch((err) => {

    })
})


//forgot password -number submission
router.get('/forgetPassword', (req, res) => {
  let noUser = req.session.noUser
  res.render('user/forgetPassword', { userHeader: true, noUser })
})


router.post('/forgetPassword', (req, res) => {

  req.session.number = req.body.number

  userHelpers.getUserDetails(req.body.number).then((user) => {

    if (user) {
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.session.number}`,
          channel: "sms"
        }).then((response) => {

          res.redirect('/forgetOtp')
          res.status(200).json({ response })
        }).catch((err) => {
          if (err.code == 60200) {
            req.session.invalidOtp = true
            res.redirect('/forgetPassword')
          } else if (err.code == 60203) {
            req.session.maxOtp = true
            res.redirect('/forgetPassword')
          }
        })


    } else {
      req.session.noUser = true
      res.redirect('/forgetPassword')

    }
  })

})
router.get('/forgetOtp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/forgetOtp', { userHeader: true })
  }
})
//forgot password -Otp submission

router.post('/forgetOtp', (req, res) => {
  let number = req.session.number
  const { otp } = req.body
  client.verify.services(serviceSID)
    .verificationChecks
    .create({
      to: `+91${number}`,
      code: otp
    })

    .then((response) => {
      if (response.status == "approved") {
        userHelpers.getUserDetails(number).then((user) => {
          res.render('user/setPassword', { userHeader: true })
        })
        console.log("correct otp");
      } else {
        console.log("incorrect otp");
      }
    }).catch((err) => {
      console.log(err);
    })
})
router.get('/setPassword', (req, res) => {
  let notSame = req.session.notSame
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/setPassword', { userHeader: true, notSame })
  }
})

//set password
router.post('/setPassword', async (req, res) => {
  let pass1 = req.body.password1
  let pass2 = req.body.password2
  let mobileNo = req.session.number
  let user = await userHelpers.getUserDetails(mobileNo)

  if (pass1 == pass2) {

    userHelpers.setPassword(mobileNo, req.body, user).then((response) => {
      req.session.loggedIn = false
      req.session.user = null
      res.redirect('/login')
    })
  } else {
    req.session.notSame = true
    res.redirect('/setPassword')
  }
})

//single product 
router.get('/single-product/:id', async (req, res) => {
  let user = req.session.user
  let product = await productHelpers.ProductDetails(req.params.id)

  let products = await productHelpers.getAllProduct()
  let topOffer = await productHelpers.topDeals()
  let cartCount = 0;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }


  res.render('user/single-product', { product, userHeader: true, cartCount, user, products, topOffer })
})


router.get('/add-to-bCart/:id', verifyLogin, async (req, res) => {
  let id = req.params.id
  await userHelpers.addtoCart(req.params.id, req.session.user._id).then((response) => {
    res.redirect('/single-product/' + id)
  })
})

//add to Cart    
router.get('/add-to-cart/:id', verifyLogin, async (req, res) => {


  await userHelpers.addtoCart(req.params.id, req.session.user._id).then((response) => {
    // res.redirect('/')
    swal("item added")

    if (response.status) {
      res.json({ status: true })
    } else if (response.exist) {
      res.json({ exist: true })
    } else {
      res.json()
    }

  })
})
//display cart
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let brands = await userHelpers.getBrands()
  let Total;
  let products = await userHelpers.getCartProduct(req.session.user._id)

  let cartTotal = await userHelpers.getCartTotal(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)


  if (cartCount != 0) {
    Total = cartTotal[0].total
  } else {
    Total = cartCount;
  }


  if (cartCount != 0) {

    res.render('user/cart', { userHeader: true, user, brands, products, Total })
  } else {
    res.redirect('/emptyCart')
  }
})
router.get('/emptyCart', (req, res) => {
  res.render('user/emptyCart', { userHeader: true, noFooter: true })
})

//empty wishlist
router.get('/empty_whishlist', (req, res) => {
  res.render('user/emptyWishlist', { userHeader: true, noFooter: true })
})

//change  quantity in cart items
router.post('/change-product-quantity', async (req, res, next) => {

  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    Total = await userHelpers.getCartTotal(req.session.user._id)
    response.sum = Total[0].total
    res.json(response)
  })
})
//delte cart Product
router.post('/delete-cart-product', (req, res) => {
  let cartId = req.body.cart
  let proId = req.body.product
  swal("amount")
  userHelpers.deleteCartProduct(cartId, proId).then((response) => {
    res.json(response)
  })

})

//cart CHECKOUT Checkoutf
router.get('/checkout', verifyLogin, async (req, res) => {
  let Total = await userHelpers.getCartTotal(req.session.user._id)

  let products = await userHelpers.getCartProduct(req.session.user._id)
  req.session.orderProduct = products

  let AllTotal = Total[0].total
  let user = req.session.user
  //adress    
  let User = req.session.user
  let adress = await userHelpers.getAdress(User)

  res.render('user/checkout', { userHeader: true, AllTotal, adress, user, products })
})

router.post('/place-order', async (req, res) => {

  let products = await userHelpers.getCartProductList(req.body.userId)


  let Oproduct = products.product;

  let totalPrice = await userHelpers.getCartTotal(req.body.userId)
  let Total = totalPrice[0].total
  userHelpers.placeOrder(req.body, Oproduct, Total).then((response) => {
    req.session.orderId = response.insertedId.toString()
    let orderId = req.session.orderId
    if (req.body['payment-method'] == 'COD') {
      res.json({ codeSuccess: true })
    } else if (req.body['payment-method'] == 'Razorpay') {
      userHelpers.generateRazorpay(orderId, Total).then((response) => {

        res.json({ response })
      })
    } else {

    }

  })
})

//BuyNow confirmation
router.get('/BuynowConfirmation', async (req, res) => {
  let proId = req.session.proId;
  let user = req.session.user
  // let Products = productHelpers.ProductDetails(proId)
  let Products = await productHelpers.ProductDetails(req.session.proId)

  let orderId = req.session.orderId
  let orders = await userHelpers.getOrderList(orderId)

  getOrProduct = await userHelpers.getOrder(orderId)

  let buyNow = true;
  res.render('user/confirmation', { userHeader: true, orders, Products, buyNow, user })
  buyNow = false;
  req.session.orderProduct = null
})

//confirmation
router.get('/confirmation', async (req, res) => {
  let user = req.session.user
  Products = req.session.orderProduct
  let orderId = req.session.orderId
  let orders = await userHelpers.getOrderList(orderId)

  getOrProduct = await userHelpers.getOrder(orderId)

  let cart = true;
  res.render('user/confirmation', { userHeader: true, orders, Products, cart, user })
  cart = false;
  req.session.orderProduct = null
})

router.get('/orderList', verifyLogin, async (req, res) => {
  let orderId = req.session.orderId
  let user = req.session.user
  let brands = await userHelpers.getBrands()

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let Products = await userHelpers.getStockProducts(req.session.user._id)

  if (orders == 0) {
    res.render('user/emptyOrder', { userHeader: true, brands })
  } else {
    res.render('user/orderList', { userHeader: true, orders, brands, Products, user })
  }

})

//payment  
router.post('/verify-payment', (req, res) => {

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })

})

router.get('/aa', (req, res) => {
  res.render('user/popovers', { userHeader: true })
})

router.get('/buyNow/:id', verifyLogin, async (req, res) => {

  let proId = ("" + req.params.id)
  req.session.proId = proId
  let Product = await productHelpers.ProductDetails(proId)
  let AllTotal = Product.price
  let user = await userHelpers.getoneUser(req.session.user._id)
  let product = await productHelpers.getOneProduct(proId)


  ///adress 
  let User = req.session.user
  let adress = await userHelpers.getAdress(User)


  res.render('user/buyNowCheck', { userHeader: true, proId, Product, AllTotal, user, adress, product, proId })
})


router.get('/checkoutt', verifyLogin, (req, res) => {
  let quantity = req.session.quantity
  res.render('user/buyNowCheck', { userHeader: true, quantity })
})
router.post('/buyNowCheck', async (req, res) => {


  let product = await productHelpers.getBuyNowProduct(req.session.proId)



  let total = await userHelpers.getBuyNowTotal(req.body.proId)

  await userHelpers.buyNow(req.body, product, total).then((response) => {
    req.session.orderId = response.insertedId.toString()
    let orderId = req.session.orderId
    if (req.body['payment-method'] == 'COD') {
      res.json({ codeSuccess: true })
    } else if (req.body['payment-method'] == 'Razorpay') {
      userHelpers.generateRazorpay(orderId, total).then(async (response) => {

        await res.json({ response })
      })
    } else {
      console.log("something went wrong");
    }
  })
})
//products
router.get('/products', async (req, res) => {
  let products = await productHelpers.getAllProduct()
  let topOffer = await productHelpers.topDeals()
  let brands = await userHelpers.getBrands()
  let user = req.session.user
  let Suser = req.session.Suser

  res.render('user/products', { userHeader: true, products, topOffer, brands, user, Suser })
})

//wishLIst
router.get('/add-to-wish/:id', verifyLogin, async (req, res) => {
  let proId = req.params.id
  await userHelpers.addToWishList(proId, req.session.user._id).then((response) => {

    // res.redirect('/') 
    res.json({ status: true })
  })
})
//display wish list
router.get('/wishList', verifyLogin, async (req, res) => {
  let user = req.session.userx
  products = await userHelpers.getWishlist(req.session.user._id)
  let brands = await userHelpers.getBrands()
  if (products.length != 0) {
    res.render('user/wishList', { userHeader: true, brands, products, user })
  } else {
    res.redirect('/empty_whishlist')
  }

})

router.post('/delete-wishlist-product', (req, res) => {
  let wishId = req.body.wishlist
  let proId = req.body.product
  userHelpers.deleteWishlistProduct(wishId, proId).then((response) => {
    res.json(response)
  })


})

router.get('/crop', (req, res) => {
  res.render('user/cropi', { noPartials: true })
})
//apply coupon
router.post('/couponApply', (req, res) => {
  let id = req.session.user._id
  userHelpers.couponValidate(req.body, id).then((response) => {
    req.session.couponTotal = response.total

    if (response.success) {
      res.json({ success: true, total: response.total })
    } else if (response.couponUsed) {
      res.json({ couponUsed: true })
    } else if (response.couponExpired) {
      res.json({ couponExpired: true })
    } else {
      res.json({ invalidCoupon: true })
    }
  })

})
//display brand products
router.get('/getBrandProduct/:id', async (req, res) => {
  let brandProduct = await userHelpers.getBrandProduct(req.params.id)
  let brand = await userHelpers.getOneBrand(req.params.id)
  let brands = await userHelpers.getBrands()
  let brandName = brand.brandName
  let user = req.session.user
  let topOffer = await productHelpers.topDeals()
  res.render('user/brand-product', { userHeader: true, brandProduct, brandName, brands, topOffer, user })


})
//my account
router.get('/myAccount', verifyLogin, async (req, res) => {
  let user = req.session.user
  let brands = await userHelpers.getBrands()
  let currentUser = await userHelpers.getoneUser(user._id)
  let adress = await userHelpers.getAdress(user)
  res.render('user/myAccount', { userHeader: true, user, adress, currentUser, brands })


})
//coupon 
router.get('/coupon', verifyLogin, async (req, res) => {
  let user = req.session.user
  let coupons = await userHelpers.getUserCoupon()
  let brands = await userHelpers.getBrands()

  res.render('user/userCoupon', { userHeader: true, brands, coupons, user })
})

router.get('/a', (req, res) => {

  res.render('user/modal')
})

router.get('/cancelOrder/:id', async (req, res) => {

  await userHelpers.cancelOrder(req.params.id).then((resp) => {
    // res.redirect('/orderList')
    res.json({ status: true })
  })

})
//adding new address
router.post('/addAdress', async (req, res) => {

  await userHelpers.addAdress(req.body)
  res.redirect('/myAccount')

})
// edit personal details

router.post('/edit_user', (req, res) => {
  userHelpers.editUser(req.body).then((resp) => {
    console.log(req.body, "editing  info")
    res.redirect('/myAccount')
  })

})

// change password
router.post('/change_password', (req, res) => {
  swal("hello")
  userHelpers.changePassword(req.body).then((response) => {

    res.redirect('/myAccount')
  })

})

//deltet adress
router.get('/del_adress/:id', (req, res) => {
  let userId = req.params.id;
  userHelpers.deleteAdress(userId).then((resp) => {
    // res.redirect('/myAccount')
    res.json({ status: true })
  })

})

//fill adress
router.get('/autoFill/:id', async (req, res) => {
  let id = req.params.id
  let adress = await userHelpers.findOneAdress(id)
  res.json({ status: true })
})

//delete order
router.post('/delete_order', (req, res) => {
  let id = req.body.OrderId
  userHelpers.deleteOrder(id).then((response) => {
    res.json({ status: true })
  })


})

router.get('/SingleOrder/:id', (req, res) => {
  let user = req.session.user
  let id = req.params.id
  userHelpers.getOrderProductss(id).then((products) => {
    res.render('user/OrderedProduct', { userHeader: true, products, user })
  })
})

module.exports = router;
