if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const express = require('express');
const mongoose = require("mongoose");

const ExpressError = require("./utils/ExpressError.js");

const {productSchema, loginSchema, enquirySchema} = require("./schema.js");

const productController = require("./controllers/product.js");
const adminController = require("./controllers/admin.js");
const enquiryController = require("./controllers/enquiry.js");
const staticController = require("./controllers/static");

const path = require('path');


const app = express();
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
    httpOnly: true
  }
}

app.use(session(sessionOptions));
app.use(flash());


const {upload}=require("./cloudinaryConfig.js");
const multer = require("multer");
const uploadBuffer = multer(); // For CKEditor (in-memory buffer)



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

app.get("/login", adminController.renderLoginPage);

app.post("/login", validateLogin, adminController.login);

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


app.post('/submit', validateEnquiry, enquiryController.submitEnquiry);


/*Global middleware
app.all("*", (req,res, next)=>{
  next(new ExpressError(404,"Page Not Found!"));
})

//Error handling middleware

app.use((err,req,res,next)=>{
  let {statusCode=500, message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs", {err, title:"Something went wrong"});
  console.log(err);
})       */


//Connecting to the Database

async function main() {
    await mongoose.connect(dbUrl);
}

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch(err => {
    console.log(err);
  });


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

