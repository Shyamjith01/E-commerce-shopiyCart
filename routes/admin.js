const { response } = require('express');
var express = require('express');
var fs = require('fs')
var router = express.Router();
var db = require('../config/connection');
var userHelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { route } = require('./user');
const { resourceUsage } = require('process');
var adminHelpers=require('../helpers/admin-helpers')


/* GET users listing. */
router.get('/', function (req, res) {
  
  res.render('admin/dashboard', { admin: true})         

});         


router.get('/login ', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin")
  } else {
    res.render("admin/adminlogin")
  }    
})

router.get('/add-product',async(req, res) => {
  let brands=await productHelpers.getAllBrand()
  res.render('admin/add-product',{brands});
})

router.post('/login', (req, res) => {
  console.log("admin admin daimin admin admin admin");
  userHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      console.log("login succes");
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = true
      console.log("login failed");
      res.redirect('/admin/login')
    }
  }) 
})


// add product


router.post("/add-product", (req, res) => {
  
  productHelpers.addProduct(req.body).then((data) => {
    let image=req.files.image
    console.log("req.files"+req.files);
    
    image.mv('./public/product-images/'+data+'.jpg',(err,done)=>{
      if(!err){

        res.render('admin/add-product');

      }else{

        console.log(err);  

      }
    })
    
    
    

  })

})

router.get('/view-product',async(req,res)=>{
  let product=await productHelpers.getAllProduct()
  res.render('admin/view-product',{product});
})
// delete product
router.get('/delete-product/:id',(req,res)=>{
      
  let id=req.params.id
  productHelpers.deleteProduct(id).then((response)=>{
    console.log(id+'deleting id');
    fs.unlinkSync('public/product-images/'+id+'.jpg')
    res.redirect('/admin/view-product')
  })

})

   
router.get('/editProduct/:id',async(req,res)=>{
  let products=await productHelpers.showProinfo(req.params.id)
  console.log(products);
  res.render('admin/editProduct',{products})
})

router.post('/editProduct/:id',(req,  res)=>{
  
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-product')
  })
})


//Banner management
router.get('/bannerManagement',async(req,res)=>{
  let banner1=await productHelpers.getBanner1()
  let banner2=await productHelpers.getBanner2()
  let banner3=await productHelpers.getBanner3()
  let banner4=await productHelpers.getBanner4()
  console.log(banner2);
  console.log(banner1.bannerTitle,'bannerTitle');
  if(req.session.already_add1==true||req.session.already_add2==true||req.session.already_add3==true||req.session.already_add4==true){
    res.render('admin/bannerManagement',{banner3, already1:req.session.already_add1,already2:req.session.already_add2,already3:req.session.already_add3,already4:req.session.already_add4,banner1,banner2}) 
    req.session.already_add1=false
    req.session.already_add2=false
    req.session.already_add3=false
    req.session.already_add4=false
  }else{
    res.render('admin/bannerManagement',{banner1})
  }
  
})

// router.post('/addBanner',(req,res)=>{
//   console.log(req.body);
//   productHelpers.addBanner(req.body).then((data) => {
//     let image=req.files.image
//     console.log("req.files"+req.files);
    
//     image.mv('./public/banner-images/'+data+'.jpg',(err,done)=>{
//       if(!err){

//         res.redirect('/admin/bannerManagement');

//       }else{

//         console.log(err);  
//       }
//       })
//     })
// }) 

//Brand Management
router.get('/brandManagement',async(req,res)=>{
  let brand=await productHelpers.getAllBrand()
  console.log(brand);
  // console.log(brands,'insise of brandmanagement');
  res.render('admin/brandManagement',{brand})
})

router.post('/addBrand',(req,res)=>{
  productHelpers.addBrand(req.body).then((data)=>{
    let image=req.files.image
    console.log(data,'data of brand');
    image.mv('./public/brand-images/'+data+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/brandManagement')
      }else{
        console.log(err);
      }
    })
  })
})

router.post('/addBanner1',(req,res)=>{
  

  productHelpers.addBanner1(req.body).then((response)=>{
    let image1=req.files.image1
    image1.mv('./public/banner-images/'+response+'.jpg',(err,done)=>{
      if(!err){
        req.session.already_add1=true;
        res.redirect('/admin/bannerManagement')
      }else{
        console.log(err);
      }
    })
    
    
  })
})


router.post('/addBanner2',(req,res)=>{
  productHelpers.addBanner2(req.body).then((response)=>{
    let image2=req.files.image2
    image2.mv('./public/banner-images/'+response+'.jpg',(err,done)=>{
      if(!err){
        req.session.already_add2=true;
        res.redirect('/admin/bannerManagement')
      }else{
        console.log(err);
      }
    })
    
    
  })
})

router.post('/addBanner3',(req,res)=>{
  

  productHelpers.addBanner3(req.body).then((response)=>{
    let image3=req.files.image3
    image3.mv('./public/banner-images/'+response+'.jpg',(err,done)=>{
      if(!err){
        req.session.already_add3=true;
        res.redirect('/admin/bannerManagement')
      }else{
        console.log(err);
      }
    })
    
    
  })
})

router.post('/addBanner4',(req,res)=>{
  

  productHelpers.addBanner4(req.body).then((response)=>{
    let image4=req.files.image4
    image4.mv('./public/banner-images/'+response+'.jpg',(err,done)=>{
      if(!err){
        req.session.already_add4=true;
        res.redirect('/admin/bannerManagement')
      }else{
        console.log(err);
      }
    })
    
    
  })
})

//user Management
//show users
router.get('/view-users',async(req,res)=>{
  
  console.log("inside of view User js");
  // let users=await adminHelpers.getAllUsers()
  let users=await adminHelpers.getBlockLess()
  console.log(users);
  res.render('admin/view-users',{users})
})

//block user
router.get('/block-user/:id',(req,res)=>{
  let id=req.params.id
  console.log(id);
  adminHelpers.blockUser(id).then((response)=>{
    console.log("user blocked");
    res.redirect('/admin/view-users')
  })
})
//get Blocked Users
router.get('/blocked-users',async(req,res)=>{
  
  let blockedUsers=await adminHelpers.getBlockedUser()
  console.log("blocking");
  console.log(blockedUsers);
  res.render('admin/blocked-users',{blockedUsers})
})
//unBlock User
router.get('/Unblock-user/:id',async(req,res)=>{
  let id=req.params.id
  await adminHelpers.unBlockUser(id).then((response)=>{
    res.redirect('/admin/blocked-users')
  })
})
module.exports = router;
