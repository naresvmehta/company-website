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
    res.render("home.ejs", {pgTitle: "Patil Machines Pvt Ltd – Complete Solutions for Soap, Detergent & Chemical Plant Machinery",
metaDescription: "Patil Machines Pvt. Ltd. delivers high-performance soap, detergent, and chemical plant machinery solutions in India and abroad — backed by decades of engineering expertise.",
 title: false, reviews, products, teams, animationDuration });
  
} catch (err) {
    console.error("Error in Home Page: ", err);
    res.render("home.ejs", {
pgTitle: "Patil Machines Pvt Ltd – Turnkey Solutions for Soap, Detergent & Chemical Plant Machinery",
metaDescription: "Patil Machines Pvt. Ltd. delivers high-performance soap, detergent, and chemical plant machinery solutions in India and abroad — backed by decades of engineering expertise.",

      title: false,
      reviews: [], // fallback to empty
      products:[],
      teams: [],
      errorMsg: "We're having trouble loading reviews & products at the moment. Please try again later."
    });
  }
};

module.exports.renderAbout = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(15);
    const products = await Product.find({});
    const teams = await Team.find({});
    const speedPerItem = 4;
    let duration = products.length * speedPerItem;
    const animationDuration = Math.min(Math.max(duration, 20), 120);

    res.render("about.ejs", {pgTitle: "About Us – Patil Machines Pvt Ltd | Engineering Legacy Since 1965",
metaDescription: "Learn about the legacy and innovation behind Patil Machines Pvt. Ltd. — pioneers in Indian soap, detergent, and chemical plant machinery, trusted by industries across India and abroad.",

      title: "About Us",
      reviews,
      products,
      teams,
      animationDuration
    });
  } catch (err) {
    console.error("Error in About Page: ", err);
    res.render("about.ejs", {pgTitle: "About Us – Patil Machines Pvt Ltd | Engineering Legacy Since 1965",
metaDescription: "Learn about the legacy and innovation behind Patil Machines Pvt. Ltd. — pioneers in Indian soap, detergent, and chemical plant machinery, trusted by industries across India and abroad.",
      title: "About Us",
      reviews: [],
      products: [],
      teams: [],
      errorMsg: "We're having trouble loading reviews & products at the moment. Please try again later."
    });
  }
};


module.exports.renderContact = (req, res) => {
  res.render("contact.ejs", {pgTitle: "Contact Us – Industrial Machinery Experts | Patil Machines Pvt Ltd",
metaDescription: "Reach out to Patil Machines Pvt. Ltd. for expert guidance on soap, detergent, and chemical plant machinery. We're here to assist with reliable and timely support.",
 title: "Contact" });
};

