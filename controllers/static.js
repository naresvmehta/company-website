const Review = require("../models/review.js");
const Product = require("../models/product.js");
const Team = require("../models/team.js");



module.exports.redirectToHome = (req, res) => {
  res.redirect("/home");
};

module.exports.renderHome = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(15); //Newly created 15 reviews only to prevent load on home page 
    const products = await Product.find({});
    const teams = await Team.find({});
    const speedPerItem = 4;
    let duration = products.length * speedPerItem;
    const animationDuration = Math.min(Math.max(duration, 20), 120); // fallback logic (20s - 120s) --> Suitable speed for upto 30 - 35 images
    res.render("home.ejs", { title: false, reviews, products, teams, animationDuration });
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

