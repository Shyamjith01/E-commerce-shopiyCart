const { response } = require('express');
var express = require('express');
var fs = require('fs')
var router = express.Router();
var db = require('../config/connection');
var userHelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { route } = require('./user');
const { resourceUsage } = require('process');
var adminHelpers = require('../helpers/admin-helpers');
const { resolve } = require('path/posix');
const fileUpload = require('express-fileupload');
const mv = require('mv');


/* GET users listing. */

//login middle ware
const verifyadminLogin = async (req, res, next) => {
  if (req.session.admin) {

    next()
  } else {
    res.redirect('/admin')
  }
}

router.get('/', (req, res) => {
  if (req.session.admin) {

    res.redirect('/admin/dashboard')
  } else {
    res.render('admin/adminLogin', { noPartials: true })
  }

})

router.post('/adminLogin', (req, res) => {
  adminHelpers.doAdminLogin(req.body).then(async (response) => {
    if (response.status) {
      req.session.admin = response.admin
      req.session.adminLogin = true
      // res.render('admin/dashboard',{adminHeader:true})
      res.redirect('/admin/dashboard')
      let todayDate = new Date().toISOString().slice(0, 10);
      let startCatOffer = await adminHelpers.startCategoryOffer(todayDate)
      let startProductOffer = await adminHelpers.startProductOffer(todayDate)
      let startCoupon = await adminHelpers.startCouponOffers(todayDate)
    } else {
      res.redirect('/admin/adminLogin')

    }
  })

})
router.get('/dashboard', async (req, res) => {
  let data = await adminHelpers.totalEarningPrice()
  if (data == null) {
    res.render('admin/dashboard', { adminHeader: true })
  } else {

    let allstatus = await adminHelpers.getAllOrderStatus()
    let total = data.total
    let salesCount = data.totalSales
    let userCount = data.usersCont
    let razorpay = data.razorpay
    let COD = data.COD
    let placed = allstatus.placed
    let cancelled = allstatus.cancelled
    let shipped = allstatus.shipped
    let delivered = allstatus.delivered
    let orders = await userHelpers.getAllOrderList()
    res.render('admin/dashboard', { adminHeader: true, placed, cancelled, shipped, delivered, total, salesCount, userCount, orders, razorpay, COD })
  }

})

router.get('/login ', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin")
  } else {
    res.render("admin/adminlogin")
  }
})

router.get('/add-product', async (req, res) => {
  let brands = await productHelpers.getAllBrand()
  let categories = await adminHelpers.getCategory()
  res.render('admin/add-product', { brands, adminHeader: true, categories });
})

router.post('/login', (req, res) => {
  userHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = true
      res.redirect('/admin/login')
    }
  })
})


// add product


router.post("/add-product", (req, res) => {
  productHelpers.addProduct(req.body).then((data) => {


    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3


    image1.mv('./public/product-images/' + data + 'a.jpg')
    image2.mv('./public/product-images/' + data + 'b.jpg')
    image3.mv('./public/product-images/' + data + 'c.jpg')



    res.redirect('/admin/view-product')

  }).catch((err) => {
    if (err.code == 11000) {
      req.session.productExist = true
      res.redirect('/admin/add-product')
    }
  })

})

router.get('/view-product', async (req, res) => {
  let product = await productHelpers.getAllProduct()
  res.render('admin/view-product', { product, adminHeader: true });
})
// delete product
router.get('/delete-product/:id', (req, res) => {

  let id = req.params.id
  productHelpers.deleteProduct(id).then((response) => {

    fs.unlinkSync('public/product-images/' + id + 'a.jpg')

    res.json({ status: true })
  })

})


router.get('/editProduct/:id', async (req, res) => {
  let products = await productHelpers.showProinfo(req.params.id)

  res.render('admin/editProduct', { products, adminHeader: true })
})

router.post('/editProduct/:id', (req, res) => {

  productHelpers.updateProduct(req.params.id, req.body).then(() => {

    if (req.files) {
      res.redirect('/admin/view-product')
      if (req.files.image1) {
        let image1 = req.files.image1
        image1.mv('./public/product-images/' + req.params.id + 'a.jpg')
      }
      if (req.files.image2) {
        let image2 = req.files.image2
        image2.mv('./public/product-images/' + req.params.id + 'b.jpg')
      }
      if (req.files.image3) {
        let image3 = req.files.image3
        image3.mv('./public/product-images/' + req.params.id + 'c.jpg')
      }

    } else {
      res.redirect('/admin/view-product')
    }
  })
})


//Banner management
router.get('/bannerManagement', async (req, res) => {
  let banner1 = await productHelpers.getBanner1()
  let banner2 = await productHelpers.getBanner2()
  let banner3 = await productHelpers.getBanner3()
  let banner4 = await productHelpers.getBanner4()

  if (req.session.already_add1 == true || req.session.already_add2 == true || req.session.already_add3 == true || req.session.already_add4 == true) {
    res.render('admin/bannerManagement', { banner3, already1: req.session.already_add1, already2: req.session.already_add2, already3: req.session.already_add3, already4: req.session.already_add4, banner1, banner2 })
    req.session.already_add1 = false
    req.session.already_add2 = false
    req.session.already_add3 = false
    req.session.already_add4 = false
  } else {
    res.render('admin/bannerManagement', { banner1, adminHeader: true })
  }

})



//Brand Management
router.get('/brandManagement', async (req, res) => {
  let brand = await productHelpers.getAllBrand()

  res.render('admin/brandManagement', { brand, adminHeader: true })
})

router.post('/addBrand', (req, res) => {
  productHelpers.addBrand(req.body).then((data) => {
    res.redirect('/admin/brandManagement')

  })
})

router.post('/addBanner1', (req, res) => {


  productHelpers.addBanner1(req.body).then((response) => {
    let image1 = req.files.image1
    image1.mv('./public/banner-images/' + response + '.jpg', (err, done) => {
      if (!err) {
        req.session.already_add1 = true;
        res.redirect('/admin/bannerManagement')
      } else {
        console.log(err);
      }
    })


  })
})


router.post('/addBanner2', (req, res) => {
  productHelpers.addBanner2(req.body).then((response) => {
    let image2 = req.files.image2
    image2.mv('./public/banner-images/' + response + '.jpg', (err, done) => {
      if (!err) {
        req.session.already_add2 = true;
        res.redirect('/admin/bannerManagement')
      } else {
        console.log(err);
      }
    })


  })
})

router.post('/addBanner3', (req, res) => {


  productHelpers.addBanner3(req.body).then((response) => {
    let image3 = req.files.image3
    image3.mv('./public/banner-images/' + response + '.jpg', (err, done) => {
      if (!err) {
        req.session.already_add3 = true;
        res.redirect('/admin/bannerManagement')
      } else {
        console.log(err);
      }
    })


  })
})

router.post('/addBanner4', (req, res) => {


  productHelpers.addBanner4(req.body).then((response) => {
    let image4 = req.files.image4
    image4.mv('./public/banner-images/' + response + '.jpg', (err, done) => {
      if (!err) {
        req.session.already_add4 = true;
        res.redirect('/admin/bannerManagement')
      } else {
        console.log(err);
      }
    })


  })
})


//show users
router.get('/view-users', async (req, res) => {
  let users = await adminHelpers.getBlockLess()
  console.log(users);
  res.render('admin/view-users', { users, adminHeader: true })
})

//block user
router.get('/block-user/:id', (req, res) => {
  let id = req.params.id
  adminHelpers.blockUser(id).then((response) => {

    res.json({ status: true })
  })
})
//get Blocked Users
router.get('/blocked-users', async (req, res) => {

  let blockedUsers = await adminHelpers.getBlockedUser()
  res.render('admin/blocked-users', { blockedUsers, adminHeader: true })
})
//unBlock User
router.get('/Unblock-user/:id', async (req, res) => {
  let id = req.params.id
  await adminHelpers.unBlockUser(id).then((response) => {
    res.redirect('/admin/blocked-users')
  })
})
router.get('/category', async (req, res) => {

  let categories = await adminHelpers.getCategory()

  res.render('admin/add-catagory', { adminHeader: true, categories })
})
router.post('/category', (req, res) => {

  adminHelpers.addCategory(req.body).then((resp) => {
    res.redirect('/admin/category')
  })
})

//category offer
router.get('/categoryOffer', async (req, res) => {
  let categories = await adminHelpers.getCategory()
  let catOffer = await adminHelpers.displayCatOffer()

  res.render('admin/category-offer', { adminHeader: true, categories, catOffer })
})
router.post('/categoryOffer', async (req, res) => {
  await adminHelpers.addCategoryOffer(req.body).then((resp) => {
    res.redirect('/admin/categoryOffer')
  })
})
router.get('/deleteCatOffer/:id', async (req, res) => {

  await adminHelpers.deleteCatOffer(req.params.id).then((resp) => {
    res.redirect('/admin/categoryOffer')
  })
})
//product offer
router.get('/productOffer', async (req, res) => {
  let products = await productHelpers.getAllProduct()
  let productOffer = await adminHelpers.displayProductOffer()

  res.render('admin/product-offer', { adminHeader: true, products, productOffer })

})
router.post('/productOffer', (req, res) => {
  adminHelpers.addProductOffer(req.body).then((resp) => {
    res.redirect('/admin/productOffer')
  })

})

//delte product offer
router.get('/deleteproductOffer/:id', (req, res) => {
  adminHelpers.deleteproductOffer(req.params.id).then((resp) => {
    // res.redirect('/admin/productOffer')
    res.json({ status: true })
  })
})

//coupon management
router.get('/coupon', async (req, res) => {
  let coupons = await adminHelpers.getCoupon()
  res.render('admin/coupon', { adminHeader: true, coupons })
})
//add  coupon 
router.post('/coupon', (req, res) => {
  adminHelpers.addCoupon(req.body).then((resp) => {
    res.redirect('/admin/coupon')
  })
})
//transactions
router.get('/allTransactions', async (req, res) => {
  let orders = await userHelpers.getAllOrderList()
  res.render('admin/all-transactions', { adminHeader: true, orders })
})
//delete brand
router.get('/deleteBrand/:id', (req, res) => {
  adminHelpers.deleteBrand(req.params.id).then(() => {
    res.redirect('/admin/brandManagement')
  })
})
//change order status
router.get('/shipped/:id', (req, res) => {
  status = "Shipped"
  adminHelpers.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/dashboard')
  })
})
router.get('/delivered/:id', (req, res) => {
  status = "delivered"
  adminHelpers.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/dashboard')
  })
})
router.get('/cancelled/:id', (req, res) => {
  status = "Cancelled"
  adminHelpers.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/dashboard')
  })
})


router.get('/useOrderedPro/:id', (req, res) => {
  let id = req.params.id
  userHelpers.getOrderProducts(id).then((products) => {

    res.render('admin/OrderedPro', { adminHeader: true, products })
  })
})


router.get('/delete-cat/:id', async (req, res) => {
  await adminHelpers.deleteCat(req.params.id).then(() => {
    res.redirect('/admin/category')
  })
})



module.exports = router;
