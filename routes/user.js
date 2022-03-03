
var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { PRODUCT_COLLECTION } = require('../config/collections');
const { channel } = require('diagnostics_channel');
const { resolve } = require('path/posix');
const { response } = require('express');
const swal = require('sweetalert');
const { REFUSED } = require('dns');

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




const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {

  console.log(req.session.user, "home sesion user");
  let user = req.session.user
  let Suser = req.session.Suser
  console.log(user, "user yaae");
  let product = await productHelpers.getAllProduct()
  let banners = await productHelpers.getBanner()
  let brands = await userHelpers.getBrands()

  //banner
  let banner1 = await productHelpers.getBanner1()
  let banner2 = await productHelpers.getBanner2()
  let banner3 = await productHelpers.getBanner3()
  let banner4 = await productHelpers.getBanner4()

  console.log(banner1, 'banner1');
  console.log(banner2, 'banner2');
  console.log(banner3, 'banner3');
  //cart Count
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }



  console.log(product.proName + 'product');
  let topOffer = await productHelpers.topDeals()
  res.render('user/index', { userHeader: true, user, product, banner1, banner2, banner3, banner4, Suser, home: true, cartCount, brands, topOffer })
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
  req.session.numberExist=false
})



router.post('/login', (req, res) => {

  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response.user, "response user");
      req.session.loggedIn = true
      req.session.user = response.user
      console.log(req.session.user, "session user");
      res.redirect('/')
    } else {
      console.log("login error founded");
      req.session.loggedInErr = true
      res.redirect('/login')
    }
  })


})

router.post('/signup', (req, res) => {
  let number = req.body.number
  userHelpers.getUserDetails(number).then((user) => {
    console.log(user);
    if (user) {
      req.session.numberExist = true
      res.redirect('/signup')
    } else {
      userHelpers.doSignup(req.body).then((response) => {
        req.session.Suser = response.user
        console.log(req.session.user, "req.session.user");
        req.session.loggedIn = true
        res.redirect('/');
      })
    }
  })


})


router.get('/contact', (req, res) => {
  let user = req.session.user
  res.render('user/contact', { userHeader: true, user: true, contact: true, user });
})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

router.post('/loginOtp', (req, res) => {

  req.session.number = req.body.number
  console.log(req.session.number, "session number");
  console.log(req.body.number, "this is number");
  console.log("out side ofuserHelpers.getUserDetails");
  userHelpers.getUserDetails(req.body.number).then((user) => {
    console.log("inside of userHelpers.getUserDetails");
    if (user) {

      console.log("inside of if user");
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.session.number}`,
          channel: "sms"
        }).then((response) => {

          // req.session.number = response.to
          console.log(response, "response");
          res.status(200).json({ response })
        }).catch((err) => {
          if (err.code == 60200) {
            req.session.invalidOtp = true
            console.log("it is invalid otp");
            res.redirect('/forgetPassword')
          } else if (err.code == 60203) {
            req.session.maxOtp = true
            res.redirect('/forgetPassword')
          }
          res.status(404).json({ errors });
          console.log("inside of error");
          console.log(err);
          res.redirect('/otpForm')
          req.session.otpErr = true
        })
      res.redirect('/otp')
    } else {
      req.session.noUser = true
      console.log("user not found with number");
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
  console.log("insided");
  let errOtp = req.session.errOtp

  res.render('user/otp', { userHeader: true, errOtp })
  req.session.errOtp = false
})

router.post('/otp', (req, res) => {
  let number = req.session.number
  const { otp } = req.body
  console.log("otp otp ", otp);
  client.verify.services(serviceSID)
    .verificationChecks
    .create({
      to: `+91${number}`,
      code: otp
    })
    // .then((resp=>{
    //   console.log('otp response',resp);
    //   // resolve(resp)
    // }))
    .then((response) => {
      console.log('otp response', response.status);
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
      console.log(err, "error in login");
    })
})


//forgot password -number submission
router.get('/forgetPassword', (req, res) => {
  let noUser = req.session.noUser
  res.render('user/forgetPassword', { userHeader: true, noUser })
})


router.post('/forgetPassword', (req, res) => {

  req.session.number = req.body.number
  console.log(req.session.number, "session number");
  console.log(req.body.number, "this is number");
  console.log("out side ofuserHelpers.getUserDetails");
  userHelpers.getUserDetails(req.body.number).then((user) => {
    console.log("inside of userHelpers.getUserDetails");
    if (user) {
      console.log("inside of if user");
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.session.number}`,
          channel: "sms"
        }).then((response) => {

          // req.session.number = response.to
          console.log(response, "Ssuccess response");
          res.redirect('/forgetOtp')
          res.status(200).json({ response })
        }).catch((err) => {
          if (err.code == 60200) {
            req.session.invalidOtp = true
            console.log("it is invalid otp");
            res.redirect('/forgetPassword')
          } else if (err.code == 60203) {
            req.session.maxOtp = true
            res.redirect('/forgetPassword')
          }
        })
      // res.render('user/forgetOtp',{userHeader:true})

    } else {
      req.session.noUser = true
      console.log("user not found with number");
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
  console.log("otp otp ", otp);
  client.verify.services(serviceSID)
    .verificationChecks
    .create({
      to: `+91${number}`,
      code: otp
    })
    // .then((resp=>{
    //   console.log('otp response',resp);
    //   // resolve(resp)
    // }))
    .then((response) => {
      console.log('otp response', response.status);
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
  console.log(user, "getUserDetails");
  if (pass1 == pass2) {
    console.log("inside of password checking");
    userHelpers.setPassword(mobileNo, req.body, user).then((response) => {
      req.session.loggedIn = false
      req.session.user = null
      console.log("redirect login");
      res.redirect('/login')
    })
  } else {
    console.log("password not match");
    req.session.notSame = true
    console.log("redirect to set password");
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
  console.log(cartCount, "cartCount");


  res.render('user/single-product', { product, userHeader: true, cartCount, user, products, topOffer })
})


router.get('/add-to-bCart/:id', verifyLogin, async (req, res) => {
  let id = req.params.id
  console.log("inside");
  await userHelpers.addtoCart(req.params.id, req.session.user._id).then((response) => {
    res.redirect('/single-product/' + id)
  })
})

//add to Cart    
router.get('/add-to-cart/:id', verifyLogin, async (req, res) => {
  console.log("call api");

  console.log("insidei of router");
  console.log(req.session.user._id, "req.session id");
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
  console.log("****", user);
  let Total;
  let products = await userHelpers.getCartProduct(req.session.user._id)
  console.log(products, "cart  pro1")
  console.log(products.brand, "brand")
  let cartTotal = await userHelpers.getCartTotal(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  console.log(cartCount, "cartCount in display cart");
  if (cartCount != 0) {
    Total = cartTotal[0].total
  } else {
    Total = cartCount;
  }

  console.log(Total, "cart Total");

  console.log(req.session.user._id, "session id in cart side");

  if (cartCount != 0) {

    res.render('user/cart', { userHeader: true, user, products, Total })
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
    console.log(Total[0].total, "total of change pro Quantity");
    response.sum = Total[0].total
    console.log(response.sum, "summmm");
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
  console.log(req.session.user._id, "this is user yo");
  let products = await userHelpers.getCartProduct(req.session.user._id)
  console.log(products, "yes this");
  console.log(Total[0].total, "inside of chekcout router");
  let AllTotal = Total[0].total
  let user = req.session.user
  console.log(user, "req.user");
  //adress 

  res.render('user/checkout', { userHeader: true, AllTotal, user, products })
})

router.post('/place-order', async (req, res) => {
  console.log("req.body jithu", req.body);
  let products = await userHelpers.getCartProductList(req.body.userId)
  let Product = products.product
  console.log(Product, "that is userId");

  let totalPrice = await userHelpers.getCartTotal(req.body.userId)
  let Total = totalPrice[0].total
  userHelpers.placeOrder(req.body, Product, Total).then((response) => {
    req.session.orderId = response.insertedId.toString()
    let orderId = req.session.orderId
    if (req.body['payment-method'] == 'COD') {
      res.json({ codeSuccess: true })
    } else if (req.body['payment-method'] == 'online-Payment') {
      userHelpers.generateRazorpay(orderId, Total).then((response) => {
        console.log(response, "response");
        res.json({ response })
      })
    } else {
      console.log("something went wrong");
    }

  })
  console.log(req.body);
})

//confirmation
router.get('/confirmation', async (req, res) => {
  let orderId = req.session.orderId
  let orders = await userHelpers.getOrderList(orderId)
  let Products = await userHelpers.getOrderProducts(orderId)
  // let products=producty[0].product
  console.log(orders, "orders inside");
  getOrProduct = await userHelpers.getOrder(orderId)
  console.log(getOrProduct, "my neww");
  console.log(Products, "this is the Products list*******")
  res.render('user/confirmation', { userHeader: true, orders, Products })
})

router.get('/orderList', verifyLogin, async (req, res) => {
  let orderId = req.session.orderId
  let user = req.session.user
  console.log(req.session.user._id, "this is user he");
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let Products = await userHelpers.getStockProducts(req.session.user._id)
  console.log(Products, "proddd");
  console.log(orders[0], "ordersss");
  res.render('user/orderList', { userHeader: true, orders, Products, user })
})

//payment  
router.post('/verify-payment', (req, res) => {
  console.log(req.body, "***-*-*-");
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment Success");
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
  console.log(req.body, "details in product");
  let proId = ("" + req.params.id)
  req.session.proId = proId
  console.log(req.session.proId, "id for  Single Prodcut");
  let Product = await productHelpers.ProductDetails(proId)
  let AllTotal = Product.price
  console.log(AllTotal, "this is the total");
  console.log(Product, "2222");
  let user = await userHelpers.getoneUser(req.session.user._id)
  console.log(user, "userUser");
  console.log(user._id, "userId");
  let product = await productHelpers.getOneProduct(proId)
  console.log(product, "this is or");


  ///adress 
  let User = req.session.user
  let adress = await userHelpers.getAdress(User)
  console.log(adress, "this is user adress");


  res.render('user/buyNowCheck', { userHeader: true, proId, Product, AllTotal, user, adress, product, proId })
})


router.get('/checkoutt', verifyLogin, (req, res) => {
  let quantity = req.session.quantity
  res.render('user/buyNowCheck', { userHeader: true, quantity })
})
router.post('/buyNowCheck', async (req, res) => {
  console.log(req.body, "body of checkout");
  console.log(req.session.proId, "proId");


  let product = await productHelpers.getBuyNowProduct(req.session.proId)
  console.log(product, "that is buyNow product");


  let total = await userHelpers.getBuyNowTotal(req.body.proId)
  console.log(total,"total in getprice");
  await userHelpers.buyNow(req.body, product, total).then((response) => {
    req.session.orderId = response.insertedId.toString()
    let orderId = req.session.orderId
    if (req.body['payment-method'] == 'COD') {
      res.json({ codeSuccess: true })
    } else if (req.body['payment-method'] == 'Razorpay') {
      userHelpers.generateRazorpay(orderId, total).then(async (response) => {
        console.log(response, "response");
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
  console.log(products, "proooo");
  res.render('user/products', { userHeader: true, products, topOffer, brands })
})

//wishLIst
router.get('/add-to-wish/:id', verifyLogin, async (req, res) => {
  let proId = req.params.id
  console.log(proId);
  await userHelpers.addToWishList(proId, req.session.user._id).then((response) => {
    console.log("inside of adding");
    // res.redirect('/')
    res.json({ status: true })
  })
})
//display wish list
router.get('/wishList', verifyLogin, async (req, res) => {
  products = await userHelpers.getWishlist(req.session.user._id)
  console.log(products, "products**");
  if (products.length != 0) {
    res.render('user/wishList', { userHeader: true, products })
  } else {
    res.redirect('/empty_whishlist')
  }

})

router.post('/delete-wishlist-product', (req, res) => {
  let wishId = req.body.wishlist
  let proId = req.body.product
  console.log(wishId, proId, "yessssss5115151");
  userHelpers.deleteWishlistProduct(wishId, proId).then((response) => {
    res.json(response)
  })


})     

router.get('/crop', (req, res) => {
  res.render('user/cropi', { noPartials: true })
})
//apply coupon
router.post('/couponApply', (req, res) => {
  console.log(req.body, "this is req.body");
  let id = req.session.user._id
  userHelpers.couponValidate(req.body, id).then((response) => {
    req.session.couponTotal = response.total
    console.log(response.total);
    console.log(response, "this is response to the coupon");
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
  let brandName = brand.brandName
  console.log(brandName, "jithuuuuuu");
  let topOffer = await productHelpers.topDeals()
  console.log(topOffer, "topoffer in brand");
  res.render('user/brand-product', { userHeader: true, brandProduct, brandName, topOffer })


})
//my account
router.get('/myAccount', verifyLogin, async (req, res) => {
  let user = req.session.user
  let currentUser = await userHelpers.getoneUser(user._id)
  console.log(currentUser, "current user ya");
  let adress = await userHelpers.getAdress(user)
  res.render('user/myAccount', { userHeader: true, user, adress, currentUser })
  console.log(user, "session user v1");

})
//coupon 
router.get('/coupon', verifyLogin, async (req, res) => {
  let coupons = await userHelpers.getUserCoupon()
  console.log(coupons, "this is coupoon");
  res.render('user/userCoupon', { userHeader: true, coupons })
})

router.get('/a', (req, res) => {
  console.log("rendrered");
  res.render('user/modal')
})

router.get('/cancelOrder/:id', async (req, res) => {
  console.log("ues");
  await userHelpers.cancelOrder(req.params.id).then((resp) => {
    res.redirect('/orderList')
  })

})
//adding new address
router.post('/addAdress', async (req, res) => {
  console.log(req.body, "add adress");
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
    console.log(req.body, "paswords")

    res.redirect('/myAccount')


  })
  console.log(req.body, "passwords")

})

//deltet adress
router.get('/del_adress/:id', (req, res) => {
  let userId = req.params.id;
  console.log(userId, "userr id adress");
  userHelpers.deleteAdress(userId).then((resp) => {
    res.redirect('/myAccount')
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
  console.log(req.body, "this is order isd");
  let id = req.body.OrderId
  console.log(id, "order id 2 ");


  userHelpers.deleteOrder(id).then((response) => {
    res.json({ status: true })
  })


})

router.get('/SingleOrder/:id', (req, res) => {
  let id = req.params.id
  console.log(id, "102");
  userHelpers.getOrderProducts(id).then((products) => {
    console.log(products, "neela");
    res.render('user/OrderedProduct', { userHeader: true, products })
  })
})

module.exports = router;
