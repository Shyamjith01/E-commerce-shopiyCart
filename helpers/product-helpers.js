var db=require('../config/connection')
var collection=require('../config/collections')
const collections = require('../config/collections')
const { resolve } = require('path/posix')
const objectId = require('mongodb').ObjectID
const { resolveCaa } = require('dns')
const { response } = require('express')



module.exports={
    // addProduct:(product,callback)=>{
    //     console.log(product);

    //     db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((product)=>{
    //         callback(product.ops[0]._id)

    //     })      
    // }
 
    addProduct: (proData) => {
        return new Promise((resolve, reject) => {
            
            
            console.log(proData);
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proData).then((response) => {
                resolve(response.insertedId.toString())

            }).catch((err) => {
                reject(err)
            })
        })

    },
    getAllProduct:()=>{
        return new Promise((resolve,reject)=>{
            let product=db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            
            resolve(product)
        })
        
        
    },
    deleteProduct:(id)=>{
        console.log('inseide of delete product helpers');
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(id)}).then((response)=>{
                resolve(response)   
            })
        })
    },
    showProinfo:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((products)=>{
                resolve(products)
            })
        })
    },
    updateProduct:(proId,product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    proName:product.proName,
                    Catagories:product.Catagories,
                    subCatagories:product.subCatagories,
                    brand:product.brand,
                    price:product.price,
                    tax:product.tax,
                    landingCost:product.landingCost,
                    color:product.color,
                    size:product.size

                }
            }).then((result)=>{
                resolve()
            })
        })
    },
    addBanner:(data)=>{
        return new Promise((resolve,reject)=>{
            console.log(data,'data');
            db.get().collection(collection.BANNER_COLLECTION).insertOne(data).then((result)=>{
                resolve(result.insertedId.toString())
            })
        })
    },
    getBanner:()=>{
        return new Promise((resolve,reject)=>{
            let banners=db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banners)    
        })
    },
    addBrand:(brandData)=>{
        return new Promise((resolve,reject)=>{

            db.get().collection(collection.BRAND_COLLECTION).insertOne(brandData).then((response)=>{
                resolve(response.insertedId.toString())
            })
        })
        
    },
    addBanner1:(banner1)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_1).insertOne(banner1).then((result)=>{
                resolve(result.insertedId.toString())
                
            })
        })
    },
    addBanner2:(banner)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_2).insertOne(banner).then((result)=>{
                resolve(result.insertedId.toString())
            })
        })
    },
    addBanner3:(banner)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_3).insertOne(banner).then((result)=>{
                resolve(result.insertedId.toString())
            })
        })
    },
    addBanner4:(banner)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_4).insertOne(banner).then((result)=>{
                resolve(result.insertedId.toString())
            })
        })
    },
    getAllBrand:()=>{
        return new Promise((resolve,reject)=>{
            let brands=db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            resolve(brands)
        })
    },
    getBanner1:()=>{
        return new Promise((resolve,reject)=>{
            let banner1=db.get().collection(collection.BANNER_1).find().toArray()
            resolve(banner1)
        })
    },
    getBanner2:()=>{
        return new Promise((resolve,reject)=>{
            let banner2=db.get().collection(collection.BANNER_2).find().toArray()
            resolve(banner2)
        })
    },
    getBanner3:()=>{
        return new Promise((resolve,reject)=>{
            let banner3=db.get().collection(collection.BANNER_3).find().toArray()
            resolve(banner3)
        })
    },
    getBanner4:()=>{
        return new Promise((resolve,reject)=>{
            let banner4=db.get().collection(collection.BANNER_4).find().toArray()
            resolve(banner4)
        })
    },
    ProductDetails:(id)=>{
        return new Promise((resolve,reject)=>{
            let product=db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)})
            resolve(product)
        })
    }
}             