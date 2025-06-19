const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    clientPhoto: {
        url: String,
        filename: String,
    },
    clientName: {
        type: String,
        required: true,
        trim: true,
    },
    clientReview: { 
        type: String,
        required: true,
        trim: true,
    }
}, { timestamps: true }); //Adds createdAt & updatedAt

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

