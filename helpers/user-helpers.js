var db=require('../config/connection');
var collection=require('../config/collections');
const bcrypt=require('bcrypt');
const { resolve } = require('path/posix');
const objectId = require('mongodb').ObjectID;
const { response } = require('express');
const { userInfo } = require('os');
const { pipeline } = require('stream');

// const { resolve } = require('path/posix');
// const { rejects } = require('assert');
// const { response } = require('express');




module.exports={
    doSignup:(userData)=>{

        return new Promise(async(resolve,reject)=>{
            let response={}
            userData.password=await bcrypt.hash(userData.password,10)
            user={
                fname:userData.fname,
                sname:userData.sname,
                number:userData.number,
                email:userData.email,
                password:userData.password,
                status:true
            }
            db.get().collection(collection.USER_COLLECTION).insertOne(user).then((data)=>{
                response.user=userData.fname
                response.status=true
                console.log(userData.sname,"datadata");
                resolve(response)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({number:userData.number})
            if(user){
                console.log(user,'this is the user');
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("login succes");   
                        response.user=user
                        response.status=true
                        resolve(response);
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("user not found error");
                resolve({status:false})
            }
        })
    },
    getUserDetails:(No)=>{
        console.log(No," No");
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({number:No})
            if(user){
                console.log(user,"user inside of getUserDetail");
                resolve(user)

            }else{
                console.log("else");
                resolve(false)
            }
        })
    },
    setPassword:(mobileNo,data,user)=>{
        return new Promise(async(resolve,reject)=>{
            data.password1=await bcrypt.hash(data.password1,10)
            let newPassword=data.password1
            db.get().collection(collection.USER_COLLECTION).updateOne({number:mobileNo},
                {
                    $set:{
                        fname:user.fname,
                        sname:user.sname,
                        number:user.number,
                        email:user.email,
                        password:newPassword,
                        status:true

                    }
                }).then((response)=>{
                    resolve(response)
                })
        })
    },
    
    //add to Cart
    addtoCart:(proId,userId)=>{
        console.log("inside of addtoCart");
        return new Promise(async(resolve,reject)=>{
            console.log("inside of promise");
            let proObj={
                item:objectId(proId),
                quantity:1
            }
            // let userCart=db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.product.findIndex(product=> product.item==proId)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({'product.item':objectId(proId)},
                    {
                        $inc:{'product.$.quantity':1} 
                    }
                    ).then((reponse)=>{
                        resolve(response)
                    })
                }else{
                console.log("inside of true");
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{product:proObj}
                    
                }).then((response)=>{
                    resolve(response)
                })
                }
            }else{
                console.log("insidei of else");      
                let cartObj={
                    user:objectId(userId),       
                    product:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve(response)
                    console.log("after the resolve else");
                })
            }
        })
    },
    indenty:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(id)})
            console.log(user);
            resolve(user)
        })
    },
    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()

            resolve(cartItems)  
            console.log(cartItems);        
        })

    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.product.length

            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        console.log(details,"details  in change product Quantity");
        details.count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{product:{item:objectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
                {
                    $inc:{'product.$.quantity':details.count}
                }
                ).then((response)=>{

                    resolve({status:true})
                    
                })
            }
        })
    },
    //delte cart product
    deleteCartProduct:(cartId,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(cartId)},
            {
                $pull:{product:{item:objectId(proId)}}
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    getCartTotal:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let Total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}   
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{'$toInt':'$quantity'},{'$toInt':'$product.price'}]}}
                    }
                }
            ]).toArray()

            resolve(Total)
        })

    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
           let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
           console.log(cart,"cart");
           
           if(cart){
               count=cart.product.length

           }
           console.log(count);
           resolve(count)
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart[0].product)
        })
    }
    
    
    
}   