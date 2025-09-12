import {  model, Schema } from "mongoose";
import type { ProductDetails } from "./tracker.type.js";

const ProductSchema = new Schema<ProductDetails>({
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : false
    },
    productId : {
        type : String,
        required : false,
    },
    productUrl : {
        type : String,
        required : true
    },
    productName : {
        type : String,
        required : true
    },
    productPrice : {
        type : Number,
        required : true
    },
    productImg : {
        type : String,
        required : true
    },
    productRatings : {
        type : Number,
        required : true
    },
    productTotalRatings : {
        type : Number,
        required : true
    },
    productDiscount : {
        type : String,
        default : null

    },
    productIsavailable : {
        type : String,
        default : null
    },
    productPriceHistory : [
        {
            price : {
                type : Number,
                required : true
            },
            date : {
                type : Date,
                default : Date.now
            }
            
        }
    ],
    productPlatform : {
        type : String,
        enum : ["amazon", "flipkart"],
        required : true    
    },
    alert : {
        enabled : { type: Boolean, default: false },
        targetPrice : { type: Number, default: null },
        userId : { type: Schema.Types.ObjectId, ref: 'User', required: false }
    }

 }, {timestamps : true})

ProductSchema.index({ productId : 1, productPlatform : 1}, {unique : true})

export const ProductModel = model<ProductDetails>("Product", ProductSchema);