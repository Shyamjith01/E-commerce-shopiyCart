var db=require('../config/connection');
var collection=require('../config/collections');
const bcrypt=require('bcrypt');
const { resolve } = require('path/posix');
const objectId=require('mongodb').ObjectId
module.exports={
    getAllUsers:()=>{
        return new Promise((resolve,reject)=>{
            let users=db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},
            {
                $set:{
                    status:false
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    getBlockedUser:()=>{
        return new Promise((resolve,reject)=>{
            let blockedUser=db.get().collection(collection.USER_COLLECTION).find({status:false}).toArray()
            resolve(blockedUser)
        })
    },
    unBlockUser:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(id)},
            {
                $set:{
                    status:true
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    getBlockLess:()=>{
        return new Promise((resolve,reject)=>{
            let unlessUsers=db.get().collection(collection.USER_COLLECTION).find({status:true}).toArray()
            resolve(unlessUsers)
        })
    }
}