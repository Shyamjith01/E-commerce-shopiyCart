
var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { PRODUCT_COLLECTION } = require('../config/collections');
const { channel } = require('diagnostics_channel');
const { resolve } = require('path/posix');
const { response } = require('express');

//twilio
// const serviceSID = "VAf9de5342bcd37794eca8246858a67a4f"
// const accountSID = "ACbdf529f89533418b5ced0942a8b7e8b0"
// const authTOKEN = "da7cd9eff8816ad16a929302d8ab1c19"
const serviceSID=process.env.serviceSID
const accountSID=process.env.accountSID
const authTOKEN=process.env.authTOKEN
const client = require('twilio')(accountSID, authTOKEN)
console.log("service Id",serviceSID);
console.log(accountSID,"accountSID");




const verifyLogin = (req, res, next) => {
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
  console.log(user);
  let product = await productHelpers.getAllProduct()
  let banners = await productHelpers.getBanner()

  //banner
  let banner1 = await productHelpers.getBanner1()
  let banner2 = await productHelpers.getBanner2()
  let banner3 = await productHelpers.getBanner3()
  let banner4 = await productHelpers.getBanner4()

  console.log(banner1, 'banner1');
  console.log(banner2, 'banner2');
  console.log(banner3, 'banner3');
  //cart Count
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  


  console.log(product.proName + 'product');
  res.render('user/index', { userHeader: true, user, product, banner1, banner2, banner3, banner4, Suser, home: true,cartCount })
});



router.get('/login', function (req, res) {

  let user = req.session.user
  loginErr=req.session.loggedInErr

    res.render('user/login', { userHeader: true, user,loginErr})
  
})

router.get('/signup', (req, res) => {
  let user = req.session.user
  let numberExist=req.session.numberExist
  res.render('user/signup', { userHeader: true, user: true, user,numberExist });
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
  let number=req.body.number
  userHelpers.getUserDetails(number).then((user)=>{
    console.log(user);
    if(user){
      req.session.numberExist=true
      res.redirect('/signup')
    }else{
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
  req.session.destroy()
  res.redirect('/')
})


// otp login
// router.post('/loginOtp',(req,res)=>{
//   const num=`+91${req.body.number}`;
//   req.session.number=req.body.number
//   console.log(req.session.number,"session number");
//   console.log(req.body.number,"this is number");
//   client.verify
//   .services(serviceSID)
//   .verifications.create({
//     to:`+91${req.body.number}`,
//     channel:"sms"
//   })
//   .then((response)=>{
//     console.log(response);

//     res.status(200).json({response})
//   })

//   res.render('user/otp',{userHeader:true})

// })

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
        }).catch((err)=>{
          console.log("inside of error");

          console.log(err);
          req.session.otpErr=true
        })
     res.render('user/otp',{userHeader:true})
    }else{
      req.session.noUser=true 
      console.log("user not found with number");
      res.redirect('/otpForm')
      
    }
  })
  // res.render('user/otp', { userHeader: true })
})  


router.get('/otpForm', (req, res) => {

  let noUser=req.session.noUser;

  res.render('user/otpform', {userHeader: true,noUser})
  req.session.noUser=false
})
//otp submision in login
router.get('/otp',(req,res)=>{
  let errOtp=req.session.errOtp

  res.render('user/otp',{userHeader:true,errOtp})
  req.session.errOtp=false
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
      if(response.valid){
        userHelpers.getUserDetails(number).then((user)=>{
          req.session.user=user
          req.session.loggedIn=true
          res.redirect('/')
        })
      }else{
        req.session.errOtp=true
        res.redirect('/otp')
      }
    })
})


//forgot password -number submission
router.get('/forgetPassword',(req,res)=>{
  let noUser=req.session.noUser
  res.render('user/forgetPassword',{userHeader:true,noUser})
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
          console.log(response, "response");
          
          res.status(200).json({ response })
        }).catch((err)=>{
          if(err.code==60200){
            req.session.invalidOtp=true
            console.log("it is invalid otp");
            res.redirect('/forgetPassword')
          }else if(err.code==60203){
            req.session.maxOtp=true
            res.redirect('/forgetPassword')
          }
        })
      // res.render('user/forgetOtp',{userHeader:true})
      res.redirect('/forgetOtp')
    }else{
      req.session.noUser=true 
      console.log("user not found with number");
      res.redirect('/forgetPassword')
      
    }
  })
  
})  
router.get('/forgetOtp',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/forgetOtp',{userHeader:true})
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
      if(response.status=="approved"){
        userHelpers.getUserDetails(number).then((user)=>{
         res.render('user/setPassword',{userHeader:true})
        })
        console.log("correct otp");
      }else{
        console.log("incorrect otp");
      }
    })
})
router.get('/setPassword',(req,res)=>{
  let notSame=req.session.notSame
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/setPassword',{userHeader:true,notSame})
  }
})

//set password
router.post('/setPassword',async(req,res)=>{
  let pass1=req.body.password1
  let pass2=req.body.password2
  let mobileNo=req.session.number
  let user=await userHelpers.getUserDetails(mobileNo)
  console.log(user,"getUserDetails");
  if(pass1 == pass2){
    console.log("inside of password checking");
    userHelpers.setPassword(mobileNo,req.body,user).then((response)=>{
      req.session.loggedIn=false
      req.session.user =null
      console.log("redirect login");
      res.redirect('/login')
    }) 
  }else{
    console.log("password not match");
    req.session.notSame =true
    console.log("redirect to set password");
    res.redirect('/setPassword')
  }
})

//single product 
router.get('/single-product/:id',async(req,res)=>{
  let product=await productHelpers.ProductDetails(req.params.id)
  res.render('user/single-product',{product,userHeader:true})
})


//cart Management
// router.get('/cart', (req, res) => {
//   let user = req.session.user
//   if(user){
//     res.render('user/cart', { userHeader: true, user });
//   }else{
//     res.redirect('/login')
//   }
  
// })

//add to Cart    
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("call api");
  console.log("insidei of router");
  console.log(req.session.user._id,"req.session id");
  userHelpers.addtoCart(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/')
  })
})
//display cart
router.get('/cart',verifyLogin,async(req,res)=>{
  let user=req.session.user
  console.log("****",user);
  let Total;
  let products=await userHelpers.getCartProduct(req.session.user._id)
  let cartTotal=await userHelpers.getCartTotal(req.session.user._id)
  let cartCount=await userHelpers.getCartCount(req.session.user._id)
  console.log(cartCount,"cartCount in display cart");
  if(cartCount!=0){
    Total=cartTotal[0].total
  }else{
    Total=cartCount;
  }
  
  console.log(Total,"cart Total");
  
  console.log(req.session.user._id,"session id in cart side");

  res.render('user/cart',{userHeader:true,user,products,Total})    

})   
    
//change  quantity in cart items
router.post('/change-product-quantity',async(req,res,next)=>{
   
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    Total=await userHelpers.getCartTotal(req.session.user._id)
    console.log(Total[0].total,"total of change pro Quantity");
    response.sum=Total[0].total
    console.log(response.sum,"summmm");
    res.json(response)   
  })
})   
//delte cart Product
router.post('/delete-cart-product',(req,res)=>{
  let cartId=req.body.cart
  let proId=req.body.product
  userHelpers.deleteCartProduct(cartId,proId).then((response)=>{
    res.json(response)
  })
  
})     

//cart CHECKOUT Checkout
router.get('/checkout',verifyLogin,async(req,res)=>{
  let Total=await userHelpers.getCartTotal(req.session.user._id)

  console.log(Total[0].total,"inside of chekcout router");
  let AllTotal=Total[0].total
  let user=req.session.user
  console.log(user,"req.user");
  res.render('user/checkout',{userHeader:true,AllTotal,user})
})

router.post('/place-order',(req,res)=>{
  console.log("inside of place order");   
  console.log(req.body);
})


module.exports = router;
