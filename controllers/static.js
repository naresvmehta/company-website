const Review = require("../models/review.js");
const Product = require("../models/product.js");



module.exports.redirectToHome = (req, res) => {
  res.redirect("/home");
};

module.exports.renderHome = async (req, res) => {
  try {
    const reviews = await Review.find({});
    const products = await Product.find({});
    res.render("home.ejs", { title: false, reviews, products });
  } catch (err) {
    console.error("Error in Home Page: ", err);
    res.render("home.ejs", {
      title: false,
      reviews: [], // fallback to empty
      products:[],
      errorMsg: "We're having trouble loading reviews & products at the moment. Please try again later."
    });
  }
};

module.exports.renderAbout = (req, res) => {
  res.render("about.ejs", { title: "About Us" });
};

module.exports.renderContact = (req, res) => {
  res.render("contact.ejs", { title: "Contact" });
};

