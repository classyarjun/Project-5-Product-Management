const orderModel = require("../Models/orderModel.js")
const productModel =require('../Models/productsModels')
const cartModel =require('../Models/cartModel')
const usermodel  = require('../Models/usermodel')
const validator = require('../validators/validator')

const createOrder = async (req,res)=>{
    const body=req.body
    let userId = req.params.userId

    try{

    if(!validator.isValidObjectId(userId)){
        return res.status(400).send({status: false, message:"userId is not vaild"})
      }
    
    //    if(userId!=req.userId){
    //     return res.status(400).send({status:false,message:"please provide valid userid"})
    //    }
       const getuser = await usermodel.findOne({_id:userId,isDeleted:false})
       if(!getuser){
       return res.status(400).send({status: false, message:"userId is not register"})
       }
       if(Object.keys(body).length===0){
        return res.status(400).send({status: false, message:"body is required"})
        }
          const {cancellable,cartId} = body
  

    if(!validator.isValidObjectId(cartId)){
        return res.status(400).send({status: false, message:"cartId is not vaild"})
      }

      const getcart = await cartModel.findOne({_id:cartId,isDeleted:false}).select({_id:0,createdAt:0,updatedAt:0}).lean();

      if(!getcart){
        return res.status(400).send({status: false, message:"cart is not register"})
        }
        const data ={
            ...getcart
        }
        const total=(getcart.items).map(b=>b.quantity)
          let totalQuantity=0
          for(let i=0;i<total.length;i++){
            totalQuantity+=total[i]
          }
         data.totalQuantity=totalQuantity;
        
                if(["true","false"].includes(cancellable)){
                    return res.status(400).send({status: false, message:"please enter valid cancellable type boolean"})
                    }   data.cancellable=cancellable
            const finalorder = await orderModel.create(data)
           return res.status(201).send({status:true,data:finalorder})

        }catch (err){
            return res.status(500).send({status:false,message:err.message})
        }
}
  
const updateorder = async (req,res)=>{
      const body = req.body
      let userId = req.params.userId
      try{

      if(!validator.isValidObjectId(userId)){
        return res.status(400).send({status: false, message:"userId is not vaild"})
      }
       const getuser = await usermodel.findOne({_id:userId,isDeleted:false})
       if(!getuser){
       return res.status(400).send({status: false, message:"userId is not register"})
       }
       
       if(Object.keys(body).length===0){
        return res.status(400).send({status: false, message:"body is required"})
        }
          const {orderId,status} = body
          if(!validator.isValidObjectId(orderId)){
            return res.status(400).send({status: false, message:"userId is not vaild"})
          }
          const order = await orderModel.findOne({_id:orderId,isDeleted:false})
          if(!order){
            return res.status(400).send({status: false, message:"orderid is not register"})
            }
            
            if(status=="cancelled"){
               if(!order.cancellable){
                return res.status(400).send({status:false,message:"you are not cancelled this order"})
              }
              if(order.status=="cancelled"){
                return res.status(400).send({status:false,message:"order is allredy cancelled"})
              }
            }
            if(order.status=="cancelled" && status=="completed"){
              return res.status(400).send({status:false,message:"order is allredy cancelled"})
            }
          
            if(!["pending", "completed", "cancelled"].includes(status)){
              return res.status(400).send({status:false,message:"please provide valid status"})
            }
            
            
             const updatesorder = await orderModel.findOneAndUpdate({_id:orderId,isDeleted:false},{$set:{status:status}},{new:true})
             res.status(200).send({status:true,data:updatesorder})  
            }catch (err){
                return res.status(500).send({status:false,message:err.message})
            }
 
}
module.exports={createOrder,updateorder}