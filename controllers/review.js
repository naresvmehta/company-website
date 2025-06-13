const Review = require("../models/review.js");
const {cloudinary} = require("../cloudinaryConfig.js");
const mongoose = require("mongoose");

const { extractPublicIds } = require("../utils/cloudinaryHelper");




//Render Review Page 
module.exports.renderReviews = async (req,res) => {
    try{
    const reviews = await Review.find({});
    res.render("showReview", {title:"Customer Reviews", reviews });
}
catch(err){
    console.error(err);
    req.flash("error", "Error in loading reviews!");
    res.redirect("/home");
}
}



//Render Review Add Page
module.exports.renderAddReviewForm = (req,res) => {
    res.render("addReview", {title:"Add Review"});
}



// Handle POST review submission
module.exports.addReview = async (req, res) => {
  try {
    const { clientName, clientReview } = req.body;

    const reviewData = {
      clientName,
      clientReview,
    };

    // If an image was uploaded, include its details in the reviewData
    if (req.file) {
      reviewData.clientPhoto = {
        url: req.file.path,       // Cloudinary image URL
        filename: req.file.filename, // Cloudinary public ID for deletion
      };
    }

    // Create a new review document in memory (not yet saved to DB)
    const review = new Review(reviewData);

    try {
      // Attempt to save review to MongoDB
      await review.save();
    } catch (saveErr) {
      // If DB save fails and an image was uploaded,
      // clean up the orphaned image from Cloudinary
      if (review.clientPhoto?.filename) {
        try {
          await cloudinary.uploader.destroy(review.clientPhoto.filename);
        } catch (cloudErr) {
          // Even if image cleanup fails, log it and continue
          console.error('Failed to delete uploaded image after DB save failed:', cloudErr);
        }
      }

      // Re-throw error to be handled by the outer catch
      throw saveErr;
    }

    // If save was successful
    req.flash('success', 'Review added successfully!');
    res.redirect('/reviews');

  } catch (err) {
    // Handle any other errors (DB/network/multer etc.)
    console.error('Error saving review:', err);
    req.flash('error', 'Failed to add review. Please try again.');
    res.redirect('/reviews/add');
  }
};




//Render Review Edit Page

module.exports.renderEditReviewForm = async(req,res) => {
try{
    const {id} = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
          req.flash("error", "Invalid review ID");
          return res.redirect("/reviews");
        }

    const review = await Review.findById(id);

    if(!review){
        req.flash("error", "Review not found");
       return res.redirect("/reviews");
    }

    res.render("editReview.ejs", {review, title: "Edit Review" });
}
catch(err){
    console.error("Error in fetching Review: ", err);
    req.flash("error", "Error in fetching Review");
    res.redirect("/reviews");
}
}




// Edit Review
module.exports.editReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      req.flash('error', 'Review not found');
      return res.redirect('/reviews');
    }

    // Update the basic fields
    review.clientName = req.body.clientName;
    review.clientReview = req.body.clientReview;

    // If a new image was uploaded
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (review.clientPhoto?.filename) {
        try {
          await cloudinary.uploader.destroy(review.clientPhoto.filename);
        } catch (cloudErr) {
          console.error('Failed to delete old image from Cloudinary:', cloudErr);
          req.flash('error', 'Old image could not be removed from Cloudinary.');
        }
      }

      // Set the new image details
      review.clientPhoto = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    // If the user clicked "Remove Photo" and didn’t upload a new one
    else if (req.body.removePhoto === 'true') {
      if (review.clientPhoto?.filename) {
        try {
          await cloudinary.uploader.destroy(review.clientPhoto.filename);
        } catch (cloudErr) {
          console.error('Failed to delete image from Cloudinary:', cloudErr);
          req.flash('error', 'Image could not be removed from Cloudinary.');
        }
      }
      review.clientPhoto = undefined;
    }

    // Save the updated review to MongoDB
    try {
      await review.save();
    } catch (saveErr) {
      // No orphan image to clean up here, since update only happens after handling image
      throw saveErr;
    }

    req.flash('success', 'Review updated successfully!');
    res.redirect('/reviews');

  } catch (err) {
    console.error('Error updating review:', err);
    req.flash('error', 'Something went wrong while updating the review.');
    res.redirect('/reviews');
  }
};




// Delete Review

module.exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      req.flash('error', 'Review not found.');
      return res.redirect('/reviews');
    }

    // Try deleting the photo from Cloudinary first (if exists)
    if (review.clientPhoto?.filename) {
      try {
        await cloudinary.uploader.destroy(review.clientPhoto.filename);
      } catch (cloudErr) {
        // Cloudinary failed (e.g. quota, file not found) — log but continue
        console.error('Failed to delete image from Cloudinary:', cloudErr);
        req.flash('error', 'Image could not be deleted from Cloudinary.');
      }
    }

    // Now delete the review from MongoDB
    await Review.findByIdAndDelete(id);

    req.flash('success', 'Review deleted successfully!');
    res.redirect('/reviews');

  } catch (err) {
    console.error('Error deleting review:', err);
    req.flash('error', 'Something went wrong while deleting the review.');
    res.redirect('/reviews');
  }
};

