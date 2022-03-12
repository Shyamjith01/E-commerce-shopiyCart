var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { resolve } = require('path/posix');
const objectId = require('mongodb').ObjectID;
const { response } = require('express');
const { userInfo } = require('os');
const { pipeline } = require('stream');
const Razorpay = require('razorpay')
let moment = require('moment');
const { ObjectId, ObjectID } = require('mongodb');
const { default: swal } = require('sweetalert');
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

// const { resolve } = require('path/posix');
// const { rejects } = require('assert);
// const { response } = require('express');




module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            let response = {}
            userData.password = await bcrypt.hash(userData.password, 10)
            user = {
                fname: userData.fname,
                sname: userData.sname,
                number: userData.number,
                email: userData.email,
                password: userData.password,
                status: true
            }
            db.get().collection(collection.USER_COLLECTION).insertOne(user).then((data) => {
                response.user = userData.fname
                response.status = true
                console.log(userData.sname, "datadata");
                resolve(response)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ number: userData.number })
            if (user) {
                console.log(user, 'this is the user');
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("login succes");
                        response.user = user
                        response.status = true

                        resolve(response);
                    } else {
                        console.log("login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("user not found error");
                resolve({ status: false })
            }
        })
    },
    getUserDetails: (No) => {
        console.log(No, " No");
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ number: No })
            if (user) {
                console.log(user, "user inside of getUserDetail");
                resolve(user)

            } else {
                console.log("else");
                resolve(false)
            }
        })
    },
    getoneUser: (id) => {
        console.log(id, " id");
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            if (user) {
                console.log(user, "user inside of getUserDetail");
                resolve(user)

            } else {
                console.log("else");
                resolve(false)
            }
        })
    },
    setPassword: (mobileNo, data, user) => {
        return new Promise(async (resolve, reject) => {
            data.password1 = await bcrypt.hash(data.password1, 10)
            let newPassword = data.password1
            db.get().collection(collection.USER_COLLECTION).updateOne({ number: mobileNo },
                {
                    $set: {
                        fname: user.fname,
                        sname: user.sname,
                        number: user.number,
                        email: user.email,
                        password: newPassword,
                        status: true

                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    //add to Cart
    addtoCart: (proId, userId) => {
        console.log("inside of addtoCart");
        return new Promise(async (resolve, reject) => {
            console.log("inside of promise");
            let proObj = {
                item: objectId(proId),
                quantity: 1
            }
            // let userCart=db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.product.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    // db.get().collection(collection.CART_COLLECTION)
                    // .updateOne({'product.item':objectId(proId)},
                    // {
                    //     $inc:{'product.$.quantity':1} 
                    // }
                    // ).then((reponse)=>{
                    //     resolve({exist:true})
                    // })
                    resolve({ exist: true })
                } else {
                    console.log("inside of true");
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { product: proObj }

                        }).then((response) => {

                            resolve({ status: true })
                        })
                }
            } else {
                console.log("insidei of else");
                let cartObj = {
                    user: objectId(userId),
                    product: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                    console.log("after the resolve else");
                })
            }
        })
    },
    indenty: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            console.log(user);
            resolve(user)
        })
    },
    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            resolve(cartItems)
            console.log(cartItems);
        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.product.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        console.log(details, "details  in change product Quantity");
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { product: { item: objectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'product.item': objectId(details.product) },
                        {
                            $inc: { 'product.$.quantity': details.count }
                        }
                    ).then((response) => {

                        resolve({ status: true })

                    })
            }
        })
    },
    //delte cart product
    deleteCartProduct: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId) },
                {
                    $pull: { product: { item: objectId(proId) } }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    getCartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let Total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ '$toInt': '$quantity' }, { '$toInt': '$product.price' }] } }
                    }
                }
            ]).toArray()

            resolve(Total)
        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart, "cart");

            if (cart) {
                count = cart.product.length

            }
            console.log(count);
            resolve(count)
        })
    },
    placeOrder: (order, product, total) => {

        console.log(product, "inside of placeorder");
        console.log(order, "this is orders");
        console.log(total, "total inside of place order");


        if (order.buyNow) {
            order.buyNow = true
        } else {
            order.buyNow = false
        }

        console.log(total);
        let userId = order.userId
        let UserId = userId.toString()
        return new Promise((resolve, reject) => {
            let dateIso = new Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            console.log(date,"now dateeee");
            let time = moment(dateIso).format('HH:mm:ss')
            
            console.log(product, "that is the details incart");
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            console.log("finish");
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    phone: order.email,
                    adress1: order.adress1,
                    adress2: order.adress2,
                    pincode: order.userpincode
                },
                userId: objectId(UserId),
                paymentMethod: order['payment-method'],
                product: product,
                totalAmount: total,
                status: status,
                dateIso: date,
                time: time,
                buyNow: order.buyNow,
                Date: date
            }
            console.log(orderObj, "finish 1");
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                console.log("finish 2");
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)
            })
            console.log("finish 3");



        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart, "cart****");
            resolve(cart)
        })
    },
    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: objectId(userId) }).toArray()
            console.log(orders, "inside of get orderlist");
            resolve(orders)
        })
    },

    getOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            resolve(orders)
        })
    }
    ,
    getStockProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let OrderProduct = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(orderId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                // {
                //     $group:{
                //         _id:null,
                //         total:{$sum:{$multiply:[{'$toInt':'$quantity'},{'$toInt':'$product.price'}]}}
                //     }
                // }
            ]).toArray()
            console.log(OrderProduct);
            resolve(OrderProduct)
        })
    }
    //get all order details
    ,
    getUserOrders: (id) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(id) }).sort({ $natural: -1 }).toArray()
            console.log((orders, "this is the order inside of see all"));    
            resolve(orders)
        })
    },
    //Razorpay
    generateRazorpay: (orderId, total) => {
        console.log(total, "total,orderID", orderId)
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log('error', err)
                } else {
                    console.log(order, "orderrrerererererer");
                    resolve(order)
                }

            });

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            console.log("Details=", details);
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', process.env.key_secret)
            hmac.update(details['response[razorpay_order_id]'] + '|' + details['response[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['response[razorpay_signature]']) {
                console.log("hmac matched");
                resolve()
            } else {
                console.log("hmac reject");
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        console.log("inside of change status");
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },
    buyNow: (order, product, total) => {

        console.log(order, "this is order");
        console.log(total);
        let Total = parseInt(total)
        console.log(Total, "total inside of place order");
        let userId = order.userId
        let UserId = userId.toString()
        return new Promise((resolve, reject) => {
            let dateIso = new Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            let time = moment(dateIso).format('HH:mm:ss')
            console.log(product, "that is the details incart");
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            console.log("finish");
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    phone: order.mobileNumber,
                    adress1: order.adress1,
                    adress2: order.adress2,
                    pincode: order.userpincode,
                },
                quantity: 1,
                userId: objectId(UserId),
                paymentMethod: order['payment-method'],
                product: product,
                totalAmount: Total,
                status: status,
                Date: date,
                time: time,
                dateIso: dateIso
            }
            console.log(orderObj, "finish 1");
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                console.log("finish 2");
                resolve(response)
            })
            console.log("finish 3");

        })
    }
    ,

    //wishlist

    //add to whish list
    addToWishList: (proId, userId) => {
        let wishObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWish) {
                console.log("inside of userWish");
                let proExist = userWish.product.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    await db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $pull: {
                                    products: { item: objectId(proId) }
                                }
                            }).then((response) => {
                                resolve(response)
                            })
                } else {
                    console.log("inside of else else");
                    await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { product: wishObj }
                        }).then((response) => {
                            console.log("pushed");
                            resolve(response)
                        })
                }
            } else {
                console.log("inside of else ");
                let newWish = {
                    user: objectId(userId),
                    product: [wishObj]
                }
                await db.get().collection(collection.WISHLIST_COLLECTION).insertOne(newWish).then((response) => {
                    resolve(response)
                    console.log("new Wish list created");
                })
            }
        })
    },
    getWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            resolve(cartItems)
            console.log(cartItems);
        })

    },
    //delte wishlist product
    deleteWishlistProduct: (wishId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(wishId) },
                {
                    $pull: { product: { item: objectId(proId) } }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    //coupon validate in user Side
    couponValidate: (data, user) => {
        console.log(data, "this is data for coupon");
        return new Promise(async (resolve, reject) => {
            obj = {}
            let date = new Date()
            date = moment(date).format('DD/MM/YYYY')
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ Coupon: data.Coupon, Available: true })
            if (coupon) {
                let users = coupon.user
                let userChecker = users.includes(user)
                if (userChecker) {
                    obj.couponUsed = true
                    console.log("Already used");
                    resolve(obj)
                } else {
                    if (date <= coupon.expiry) {
                        let Total = parseInt(data.Total)
                        let percentage = parseInt(coupon.offer)
                        let discountVal = ((Total * percentage) / 100).toFixed()
                        obj.total = Total - discountVal
                        obj.success = true
                        console.log("this tottal", Total, "this percetage", percentage, "discount", discountVal);
                        console.log(obj, "this is obj**")
                        resolve(obj)
                    } else {
                        obj.couponExpired = true
                        console.log("Expired");
                        resolve(obj)
                    }
                }
            } else {
                obj.invalidCoupon = true
                console.log("invalid");
                resolve(obj)
            }
        })
    },
    getBrands: () => {
        return new Promise(async (resolve, reject) => {
            let brands = await db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            resolve(brands)
        })
    },
    getBrandProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            let Brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ _id: objectId(id) })
            let brands = await db.get().collection(collection.PRODUCT_COLLECTION).find({ brand: Brand.brandName }).toArray()
            resolve(brands)
        })
    },
    getOneBrand: (id) => {
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ _id: objectId(id) })
            resolve(brand)
        })
    }
    ,
    getAllOrderList: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

            resolve(orders)
        })
    },
    //get coupon details
    getUserCoupon: () => {
        let today = new Date()
        console.log(today, "that is the date");

        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find({ endDateISo: { $gte: today } }).toArray()
            resolve(coupons)
        })
    },
    cancelOrder: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        Cancelled: true,
                        status: 'Cancelled'
                    }
                }).then((resp) => {
                    resolve(resp)
                })
        }).catch((err) => {
            console.log(err);
            alert(err)
        })
    },
    addAdress: (data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_ADRESS).insertOne(data).then(() => {
                resolve()
            })
        })
    },
    getAdress: (user) => {
        console.log(user, "userId inside of getadd details");
        let userId = user._id
        console.log(userId, "userId inside of getadd1");
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.USER_ADRESS).find({ userId: userId }).toArray()
            console.log(adress, "real adress");
            resolve(adress)
        })
    },
    getAdressByObjectId: (user) => {
        console.log(user, "userId inside of getadd details");
        let userId = user._id
        console.log(userId, "userId inside of getadd1");
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.USER_ADRESS).find({ userId: objectId(userId) }).toArray()
            console.log(adress, "real adress");
            resolve(adress)
        })
    },
    editUser: (user) => {
        let userid = user.userId
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                {
                    $set: {
                        fname: user.fName,
                        sname: user.sName,
                        number: user.mobileNumber,
                        email: user.email
                    }
                })
            resolve()
        })
    },
    //change password
    changePassword: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let p1 = data.pass1
            let p2 = data.pass2
            let userId = data.userId
            console.log(data, "password data");
            console.log(data.currentPassword, "data current password");
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(data.userId) })
            if (user) {

                console.log(user, "this is the user details");
                data1 = await bcrypt.hash(data.pass1, 10);

                console.log(user.password, "user.password d");
                bcrypt.compare(data.currentPassword, user.password).then(async (status) => {
                    if (status) {
                        console.log("yes");
                        response.status = true
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(data.userId) },
                            {
                                $set: {
                                    password: data1
                                }
                            }).then((response) => {
                                console.log("password change succes fully");
                                resolve(response)
                            })
                    } else {
                        response.status = false
                        resolve(response)
                        console.log("invailed password");
                    }
                })
            }

        })

    },
    deleteAdress: (Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_ADRESS).deleteOne({ _id: objectId(Id) }).then((resp) => {
                console.log("succes fully deleted");
                resolve(resp)
            })
        })
    },

    //get one user Adress
    displayAdress: (id) => {
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.USER_ADRESS).find({ userId: objectId(id) }).toArray()
            console.log(adress, "this is adress");
            resolve(adress)
        })
    },
    findOneAdress: (id) => {
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.USER_ADRESS).findOne({ _id: ObjectId(id) })
            console.log(adress, "single adress");
            resolve(adress)
        })
    },
    deleteOrder: (OrderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: objectId(OrderId) }).then(() => {
                console.log("ordder delted succes fully");
                resolve()
            })
        })
    },
    getOrderProductss: (OrderID) => {
        return new Promise(async (resolve, reject) => {
            let OrderedProduct = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(OrderID) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(OrderedProduct, "this is the single orrder");
            resolve(OrderedProduct)

        })
    },
    getBuyNowTotal: (pId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(pId) })
            console.log(product.price, "getBuyNowTotal price");
            resolve(product.price)
        })
    },
    getUserCartOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let OrderProduct = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                // {
                //     $group:{
                //         _id:null,
                //         total:{$sum:{$multiply:[{'$toInt':'$quantity'},{'$toInt':'$product.price'}]}}
                //     }
                // }
            ]).toArray()
            console.log(OrderProduct);
            resolve(OrderProduct)
        })
    }
}