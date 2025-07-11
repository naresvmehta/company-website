require('dotenv').config();

const express = require('express');
const app = express();

const rateLimit = require('express-rate-limit');

const mongoose = require("mongoose");

const ExpressError = require("./utils/ExpressError.js");

const {productSchema, loginSchema, enquirySchema, faqSchema, reviewSchema, teamSchema} = require("./schema.js");

const productController = require("./controllers/product.js");
const adminController = require("./controllers/admin.js");
const enquiryController = require("./controllers/enquiry.js");
const staticController = require("./controllers/static");
const faqController = require("./controllers/faq.js");
const reviewController = require("./controllers/review.js");
const teamController = require("./controllers/team.js");

const path = require('path');


const engine = require('ejs-mate');
const PORT = process.env.PORT;

const methodOverride = require("method-override");
app.use(methodOverride("_method"));


const dbUrl = process.env.DB_URL;

app.use('/assets', express.static(path.join(__dirname, 'assets'))); //Acquiring CSS/JS files from root folder


// Middleware to parse urlencoded form data (from HTML form POST)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data (if needed)
app.use(express.json());

app.engine('ejs', engine);
app.set("view engine", "ejs"); //ejs-mate
app.set("views", path.join(__dirname, "views"));  //ejs templates inside "views" folder

const session = require('express-session');
const MongoStore = require("connect-mongo");
const flash = require('express-flash');

const store = MongoStore.create({
mongoUrl:dbUrl,
crypto:{
  secret:process.env.SECRET,
},
touchAfter:24*3600 //After 1 day
})

store.on("error", (err)=> console.log("ERROR IN MONGO STORE", err));


const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,  // Only save session if something is stored
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax',
    //.env values are parsed as strings by default — even numbers or booleans become strings
  }
}

app.use(session(sessionOptions));
app.use(flash());


const {upload, uploadReview, uploadTeam}=require("./cloudinaryConfig.js");
const multer = require("multer");
const uploadBuffer = multer(); // For CKEditor (in-memory buffer)

const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);


//Global Middleware

app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.admin=req.session.admin || false;
  next();

})


//isAdmin middleware
const isAdmin = (req,res,next) => {
  if(!req.session.admin){
    req.flash("error", "Please login to continue");
    return res.redirect("/login");
  }
  next();
}

//HTTP Static ROUTES


app.get("/", staticController.redirectToHome);
app.get("/home", staticController.renderHome);
app.get("/about", staticController.renderAbout);
app.get("/contact", staticController.renderContact);

//Validate Login Page

const validateLogin = (req,res,next) =>{
  const {error} = loginSchema.validate(req.body);
  if(error){
    req.flash("error", error.details.map(d => d.message).join(", "));
    return res.redirect("/login");
  }
  next();
}

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 login attempts per 10 mins
  handler: (req, res, next) => {
    req.flash('error', "Too many login attempts. Please try again after 10 minutes");
    req.session.save(() => res.redirect("/login"));
  },
  standardHeaders: true,
  legacyHeaders: false,
});


app.get("/login", adminController.renderLoginPage);

app.post("/login", loginLimiter, validateLogin, adminController.login);

app.post("/logout", isAdmin, adminController.logout);



//Validate Product (Server-side validation)


const validateProduct = (req,res,next) =>{
  const {error} = productSchema.validate(req.body);
  if(error){
  req.flash("error", error.details.map(d => d.message).join(", "));
  return res.redirect("/products");
  }else{
    next();
  }
}



// 1. List all products
app.get("/products", productController.index);

// 2. Show Add Product form
app.get("/products/add", isAdmin, productController.renderAddProductForm);

// 3. Handle Add Product form submission
app.post("/products", isAdmin, upload.single("coverImage"), validateProduct, productController.createProduct);

// 4. Upload image for CKEditor (not product-specific)
app.post("/upload-image", isAdmin, uploadBuffer.single("upload"), productController.uploadDescriptionImage);

// 5. Show Edit form — must be before /products/:id
app.get("/products/:id/edit", isAdmin, productController.renderEditForm);

// 6. Show Delete confirmation page — before /products/:id
app.get("/products/:id/delete", isAdmin, productController.renderDeleteForm);

// 7. Handle Product Update
app.put("/products/:id", isAdmin, upload.single("coverImage"), validateProduct, productController.updateProduct);

// 8. Delete Product
app.delete("/products/:id", isAdmin, productController.deleteProduct);

// 9. Show individual product (must be last!)
app.get("/products/:id", productController.showProduct);



//FAQ Form

const validateFaq = (req,res,next) =>{
  const {error} = faqSchema.validate(req.body);
  if(error){
   req.flash("error", error.details[0].message);
 
     if (req.method === "POST") {
      return res.redirect("/faq/add");
    } else if (req.method === "PUT" && id) {
      return res.redirect(`/faq/${id}/edit`);
    }
    return res.redirect("/faq");
  }
  next();
}

// 1. List All FAQs
app.get("/faq", faqController.renderFaq);

// 2. Show Add FAQ Form (static route first!)
app.get("/faq/add", isAdmin, faqController.renderAddFaqForm);

// 3. Handle Add FAQ Form
app.post("/faq", isAdmin, validateFaq, faqController.AddFaq);

// 4. Render Edit FAQ Form
app.get("/faq/:id/edit", isAdmin, faqController.renderEditFaqForm);

// 5. Edit FAQ
app.put("/faq/:id", isAdmin, validateFaq, faqController.editFAQ);

// 6. Delete FAQ
app.delete("/faq/:id", isAdmin, faqController.deleteFAQ);





//Reviews Section

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    req.flash('error', error.details.map(el => el.message).join(', '));
    return res.redirect('/reviews');
  }
  next();
};

// 1. Display All Reviews (Public)
app.get("/reviews", reviewController.renderReviews);

// 2. Display Add Review Form (Admin Only)
app.get("/reviews/add", isAdmin, reviewController.renderAddReviewForm);

// 3. Add Review (Admin Only)
app.post("/reviews", isAdmin, uploadReview.single('clientPhoto'), validateReview, reviewController.addReview);

// 4. Display Edit Review Form (Admin Only)
app.get("/reviews/:id/edit", isAdmin, reviewController.renderEditReviewForm);

// 5. Edit Review (Admin Only)
app.put("/reviews/:id", isAdmin, uploadReview.single('clientPhoto'), validateReview, reviewController.editReview);

// 6. Delete Review (Admin Only)
app.delete("/reviews/:id", isAdmin, reviewController.deleteReview);






const validateTeam = (req,res,next) => {
  const {error} = teamSchema.validate(req.body);
  if(error){
    req.flash("error", "Invalid Input");
    return res.redirect("/home");
  }
  next();
}


// 1. Show Add Team Photo Form (All Admin-only access)
app.get("/teams/add", isAdmin, teamController.renderAddTeamPhotoForm);

// 2. Handle Add Team Photo (with image upload & validation)
app.post("/teams", isAdmin, uploadTeam.single("coverImage"), validateTeam, teamController.addTeamPhoto);

// 3. Show Edit Form
app.get("/teams/:id/edit", isAdmin, teamController.renderEditTeamPhotoForm);

// 4. Handle Edit (with image upload & validation)
app.put("/teams/:id", isAdmin, uploadTeam.single("coverImage"), validateTeam, teamController.editTeamPhoto);

// 5. Delete Team Photo
app.delete("/teams/:id", isAdmin, teamController.deleteTeamPhoto);









//Validate Enquiry Form

const validateEnquiry = (req, res, next) => {
  const { error } = enquirySchema.validate(req.body, { abortEarly: false });

  if (error) {
    // Collect all error messages into a single string
    const errorMessages = error.details.map(d => d.message).join(', ');
    req.flash('error', errorMessages);
    
    // Redirect back to the form page (adjust if your form route is different)
    return res.redirect("/contact");
  }

  next();
};

// Rate limiter for contact form submissions
const contactFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 requests per windowMs (So max 15 requests in 10 mins)
 handler: (req, res, next) => {
 const backUrl = req.body.fromPage || req.get("Referer") || '/home';
  req.flash('error', "Too many enquiries sent from this IP. Please try again after 10 minutes");
  req.session.save(() => res.redirect(backUrl)); //Ensures flash messages are saved in sessions before redirecting
},
  standardHeaders: true,  // modern rate limit headers
  legacyHeaders: false,   // disable old headers
});

app.post('/submit', contactFormLimiter, validateEnquiry, enquiryController.submitEnquiry);


//Global middleware

app.use((req, res, next) => {
  next(new ExpressError(404, "Sorry, the page you are looking for does not exist"));
});

//Error handling middleware

app.use((err,req,res,next)=>{
  let {statusCode=500, message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs", {err});
  console.log(err);
})      


//Connecting to the Database

async function main() {
    await mongoose.connect(dbUrl, {
  family: 4 // 👈 to force IPv4 for Atlas
});
}

main()
  .then(() => {
    console.log("Connected to DB");

    // Pinging every 9 minutes after successful DB connection
    setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
        console.log("MongoDB pinged to prevent sleep.");
      } catch (err) {
        console.error("MongoDB ping failed:", err.message);
      }
    }, 9 * 60 * 1000); // 9 minutes
  })
  .catch(err => {
    console.log(err);
  });


app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});

