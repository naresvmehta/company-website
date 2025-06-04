const mongoose = require("mongoose");

const {Schema} = mongoose;

const productSchema = new Schema({
    title:{
        type: String,
        required:true,
    },
    coverImage:{
        url:String,
        filename: String,
    },
    description:{     //Optional
        type:String,
    }
})

const Product = mongoose.model("Product", productSchema);

module.exports = Product;