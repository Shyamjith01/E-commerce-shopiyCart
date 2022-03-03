var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { resolve } = require('path/posix');
const objectId = require('mongodb').ObjectId
var moment = require('moment')
module.exports = {
    doAdminLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ number: data.number })
            console.log(admin)
            if (admin) {
                console.log("email admin founded");
                if (admin.password == data.password) {
                    response.admin = admin,
                        response.status = true
                    resolve(response)
                } else {
                    console.log("admin pass word incorrect");
                    resolve({ status: false })
                }
            } else {
                console.log("admin not found");
                resolve({ status: false })
            }

        })
    }
    ,
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            let users = db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: false
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    getBlockedUser: () => {
        return new Promise((resolve, reject) => {
            let blockedUser = db.get().collection(collection.USER_COLLECTION).find({ status: false }).toArray()
            resolve(blockedUser)
        })
    },
    unBlockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: true
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    getBlockLess: () => {
        return new Promise((resolve, reject) => {
            let unlessUsers = db.get().collection(collection.USER_COLLECTION).find({ status: true }).toArray()
            resolve(unlessUsers)
        })
    },
    addCategory: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((resp) => {
                resolve(resp)
            })
        })
    },
    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    //category offer
    addCategoryOffer: (data) => {
        console.log(data, "data");
        offerPercentage = parseInt(data.offerPercentage)
        Cdata = {
            category: data.category,
            startingDate: data.startingDate,
            expiry: data.expiry,
            offerPercentage: offerPercentage
        }
        console.log(Cdata, "Cdata");
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_OFFER).insertOne(Cdata).then((resp) => {
                resolve(resp)
            })
        })
    },
    displayCatOffer: () => {
        return new Promise(async (resolve, reject) => {
            let catOffers = await db.get().collection(collection.CATEGORY_OFFER).find().toArray()
            resolve(catOffers)
        })
    },
    deleteCatOffer: (id) => {
        console.log(id, "ided");
        return new Promise(async (resolve, reject) => {
            let categoryOffer = await db.get().collection(collection.CATEGORY_OFFER).findOne({ _id: objectId(id) })
            console.log(categoryOffer, "8");
            let Cname = categoryOffer.category
            console.log(Cname, "Cname");

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subCatagories: Cname }).toArray();
            console.log(products, "prooooo");
            if (products) {
                db.get().collection(collection.CATEGORY_OFFER).deleteOne({ _id: objectId(id) }).then(async () => {
                    products.map(async (product) => {
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                            {
                                $set: {
                                    price: product.landingCost
                                },
                                $unset: {
                                    offer: "",
                                    catOfferPercentage: "",
                                    actualPrice: ""
                                }
                            }).then(() => {
                                resolve()
                            })
                    })
                })
            } else {
                resolve()
            }

        })
    },
    startCategoryOffer: (date) => {
        let startDate = new Date(date)

        let startDateIso = moment(date).format('DD/MM/YYYY')
        console.log(startDateIso, "category starting offer");
        return new Promise(async (resolve, reject) => {
            console.log("11");
            let data = await db.get().collection(collection.CATEGORY_OFFER).find({ startingDate: { $lte: startDateIso } }).toArray();
            console.log("22 ", data);
            if (data.length > 0) {
                await data.map(async (onedata) => {
                    console.log("33", onedata.category);
                    let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: onedata.Category, offer: { $exists: false } }).toArray();
                    console.log("44", products);


                    await products.map(async (product) => {
                        console.log(product, "**++");
                        let actualprice = product.price
                        let newPrice = (((product.price) * (onedata.offerPercentage)) / 100)
                        newPrice = newPrice.toFixed()
                        // let id=product._id
                        // console.log(id,"this is id ya");
                        console.log(actualprice, newPrice, onedata.offerPercentage, "yes this");
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                            {
                                $set: {
                                    actualprice: actualprice,
                                    price: (actualprice - newPrice),
                                    offer: true,
                                    offerPercentage: onedata.offerPercentage
                                }
                            })
                    })
                })
                resolve();
            } else {
                console.log("elsed");
                resolve()
            }
        })
    },
    //product offer
    addProductOffer: (data) => {
        console.log(data, "product offer data");
        return new Promise(async (resolve, reject) => {
            data.startDateIso = new Date(data.startingDate)
            data.endDateIso = new Date(data.expiry)
            data.offerPercentage = data.offerPercentage
            await db.get().collection(collection.PRODUCT_OFFER).insertOne(data).then((resp) => {
                resolve(resp)
            })
        })
    },
    displayProductOffer: () => {
        return new Promise(async (resolve, reject) => {
            let productOffer = await db.get().collection(collection.PRODUCT_OFFER).find().toArray();
            resolve(productOffer)
        })
    },
    deleteproductOffer: (id) => {
        console.log(id);

        return new Promise(async (resolve, reject) => {
            let productOffer = await db.get().collection(collection.PRODUCT_OFFER).findOne({ _id: objectId(id) })
            let pName = productOffer.proName
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ proName: pName })
            await db.get().collection(collection.PRODUCT_OFFER).deleteOne({ _id: objectId(id) }).then(async (resp) => {
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ proName: pName },
                    {
                        $set: {
                            price: product.landingCost
                        },
                        $unset: {
                            offer: "",
                            proOffer: "0",
                            offerPercentage: "0",
                            actualprice: "0"
                        }
                    }).then(() => {
                        resolve()
                    })

            })
        })
    },
    startProductOffer: (date) => {
        console.log("inside of starting product offer");
        let startDateIso = new Date(date);
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.PRODUCT_OFFER).find({ startDateIso: { $lte: startDateIso } }).toArray()
            console.log(data, "daaaaata");
            if (data.length > 0) {
                await data.map(async (onedata) => {
                    console.log("33L", onedata.proName);
                    let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ proName: onedata.proName, offer: { $exists: false } })
                    console.log("44L", product);

                    if (product) {
                        let actualPrice = product.price
                        let newPrice = (((product.price) * (onedata.offerPercentage)) / 100)
                        newPrice = newPrice.toFixed()
                        console.log(actualPrice, newPrice, onedata.offerPercentage);
                        console.log("yes reached");
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                            {
                                $set: {
                                    actualPrice: actualPrice,
                                    price: (actualPrice - newPrice),
                                    offer: true,
                                    offerPercentage: onedata.offerPercentage
                                }
                            })

                        resolve()
                    } else {
                        resolve()
                    }

                })
                resolve();
            } else {
                console.log("elsed");
                resolve()
            }
        })
    },
    //add coupon 
    addCoupon: (data) => {
        return new Promise(async (resolve, reject) => {
            let startDateIso = new Date(data.startingDate)
            let endDateISo = new Date(data.expiry)
            let expiry = await moment(data.expiry).format('YYYY-MM-DD')
            let starting = await moment(data.startingDate).format('YYYY-MM-DD')
            let dataObj = await {
                Coupon: data.coupon,
                offer: parseInt(data.offerPercentage),
                starting: starting,
                expiry: expiry,
                startDateIso: startDateIso,
                endDateISo: endDateISo,
                user: []
            }
            await db.get().collection(collection.COUPON_COLLECTION).insertOne(dataObj).then((resp) => {
                resolve(resp)
            })
        })
    },
    //get Coupons
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {

            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    startCouponOffers: (date) => {
        let couponStartDate = new Date(date);
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.COUPON_COLLECTION).find({ startDateIso: { $lte: couponStartDate } }).toArray();
            if (data) {
                await data.map(async (oneData) => {
                    console.log(oneData, "this is oneData");
                    db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: objectId(oneData._id) },
                        {
                            $set: {
                                Available: true
                            }
                        }).then(() => {
                            resolve();
                        })
                })
            } else {
                resolve()
            }
        })
    },
    totalEarningPrice: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ status: { $nin: ['Cancelled'] } }).toArray();
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            console.log(orders[0].status, "status,,");
            console.log(orders, "orders inside of totalEarning")
            let userLength = users.length
            let ordersLength = orders.length
            let Total = 0;
            let total = parseInt(Total)
            let Count = 0;
            let count = parseInt(Count)
            let Razorpay = 0;
            let razorpay = parseInt(Razorpay)
            let COD = 0;
            let placed = 0;
            let cancelled = 0;
            let shipped = 0;
            let delivered = 0;
            console.log(ordersLength, "order Length")
            for (i = 0; i < ordersLength; i++) {
                count++;
                total = total + orders[i].totalAmount
                if (orders[i].paymentMethod == 'online-Payment') {
                    razorpay++;
                } else if (orders[i].paymentMethod == 'COD') {
                    COD = COD + 1;
                } else if (orders[i].status == 'placed') {
                    placed = placed + 1;
                } else if (orders[i].status == 'Cancelled') {
                    cancelled = cancelled + 1;
                } else if (orders[i].status == 'Shipped') {
                    shipped = shipped + 1;
                } else if (orders[i].status == 'Delivered') {
                    delivered = delivered + 1;
                }

            }
            let data = {
                total: total,
                totalSales: count,
                usersCont: userLength,
                COD: COD,
                razorpay: razorpay,
                placed: placed,
                cancelled: cancelled,
                shipped: shipped,
                delivered: delivered,

            }


            console.log(total, "last total");
            console.log(data, "is its");
            resolve(data)

        })
    },
    getAllOrderStatus: () => {
        let orderStatus = {}
        return new Promise(async (resolve, reject) => {
            //To get number of placed orders
            let placedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "placed"
                    }
                }
            ]).toArray()
            let placedLen = placedProducts.length
            // orderStatus.push(placedLen)
            orderStatus.placed=placedLen;
            //To get number of shipped orders
            let shippedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Shipped"
                    }
                }
            ]).toArray()
            let shippedLen = shippedProducts.length
            // orderStatus.push(shippedLen)
            orderStatus.shipped=shippedLen;
            //To get number of delivered orders
            let deliveredProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                }
            ]).toArray()
            let deliveredLen = deliveredProducts.length
            // orderStatus.push(deliveredLen)
            orderStatus.delivered=deliveredLen;
            //To get number of cancelled orders
            let pendingProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Cancelled"
                    }
                }
            ]).toArray()
            let pendingLen = pendingProducts.length
            // orderStatus.push(pendingLen)
            orderStatus.cancelled=pendingLen;
            //Resolve all order status in an array for chart
            resolve(orderStatus)
        })
    },
    //delte brand
    deleteBrand: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).deleteOne({ _id: objectId(id) }).then(() => {
                resolve()
            })
        })
    },
    changeOrderStatus: (orderId, stat) => {
        return new Promise((resolve, reject) => {
            console.log("change orderId entered");
            if (stat == "Delivered") {
                db.get().collectione(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: stat,
                            Delivered: true,
                            Cancelled: false
                        }
                    }).then(() => {
                        resolve()
                    })
            } else if (stat == "Cancelled") {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: stat,
                            Cancelled: true
                        }
                    }).then(() => {
                        resolve()
                    })
            } else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: stat
                        }
                    }).then(() => {
                        resolve()
                    })
            }
        })
    },
    //delete  category
    deleteCat:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(id)}).then(()=>{
                resolve()
            })
        })
    }
}