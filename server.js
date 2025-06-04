if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const express = require('express');
const mongoose = require("mongoose");
const { google } = require('googleapis');
const sendEnquiryMail=require("./sendEnquiryMail.js");

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

const { cloudinary } = require("./cloudinaryConfig.js");
const multer = require("multer");
const uploadBuffer = multer(); // For CKEditor (in-memory buffer)

const Product = require("./models/product.js");

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

//HTTP ROUTES

//Redirect / to /home

app.get("/", (req,res)=>{
  res.redirect("/home");
})

//Home Page
app.get("/home", (req,res)=>{
  res.render("home.ejs", {title:false});
})

//About Page
app.get("/about", (req,res) => {
  res.render("about.ejs", {title: "About Us"});
})

//Contact Page

app.get("/contact", (req,res)=>{
  res.render("contact.ejs", {title: "Contact"});
})

//Login Page 

app.get("/login", (req,res)=>{
  res.render("login.ejs");
})

app.post("/login", (req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
  
  if(username == process.env.ADMIN_USERNAME && password == process.env.ADMIN_PASSWORD){
    req.session.admin=true;
    req.flash("success", "Welcome back Admin!");
    return res.redirect("/home");
  }
  req.flash("error", "Invalid Login Credentials");
  res.redirect("/login");
})


//Logout Page 

//POST Req to prevent Cross-Site Request Forgery (CSRF) attack

app.post('/logout', isAdmin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      return res.redirect('/login'); 
    }
    res.clearCookie("connect.sid"); //Clear the admin session cookie
    res.redirect('/home'); 
  });
});


//Render Add Product Form

app.get("/products/add", isAdmin, (req,res)=>{
  res.render("addProduct.ejs", {title: "Add New Products"});
})


// Handle Add Product form submission

app.post("/products",isAdmin, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const coverImage = {
         url: req.file.path,
         filename: req.file.filename
};

    const product = new Product({ title, description, coverImage });
    await product.save();

    req.flash("success", "New product added successfully!");
    res.redirect("/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add plant. Please try again.");
    res.redirect("/products/new");
  }
});

// CKEditor Upload Route
app.post("/upload-image", isAdmin, uploadBuffer.single("upload"), async (req, res) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "PatilMachines/Description" },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ uploaded: false, error: { message: "Upload failed." } });
        }

        // Return with both url & default for CKEditor compatibility
        return res.json({
          uploaded: true,
          url: result.secure_url,
          default: result.secure_url
        });
      }
    );
    stream.end(req.file.buffer); // in-memory buffer
  } catch (err) {
    console.error(err);
    res.status(500).json({ uploaded: false, error: { message: err.message } });
  }
});

//Render Edit Product Form

app.get("/products/:id/edit", isAdmin, async(req,res)=>{
  try{
    const {id} = req.params;
    const product = await Product.findById(id);

    if(!product){
      req.flash("error", "Product not found");
      return res.redirect("/products");
    }
   res.render("editProduct.ejs", {title:"Edit Form", product});
   }
   catch(err){
    console.error("Error in opening the Edit Form", err);
    req.flash("error", "Something went wrong. Please try again later");
    res.redirect(`/products/${id}`);
   }
})

//Edit Product
app.put("/products/:id", upload.single("coverImage"), isAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const product = await Product.findById(id);

  if (!product) {
    req.flash("error", "Product not found");
    return res.redirect("/products");
  }

  product.title = title;
  product.description = description;

  if (req.file) {  //If new image exists

    // Delete old image from Cloudinary
    await cloudinary.uploader.destroy(product.coverImage.filename);
    // Update with new image
    product.coverImage = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await product.save();
  req.flash("success", "Product details updated successfully");
  res.redirect(`/products/${id}`);
});

//Show Deletion Confirmation Mssg

app.get("/products/:id/delete",isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }

    res.render("deleteProduct.ejs", { title: "Delete Product", product });
  } catch (err) {
    console.error("Error loading delete page:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/products");
  }
});

//Delete the Product (From both Cloudinary & DB)

app.delete("/products/:id",isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }

    // Delete cover image from Cloudinary
    await cloudinary.uploader.destroy(product.coverImage.filename);

    // Delete product from DB
    await Product.findByIdAndDelete(id);

    req.flash("success", "Product deleted successfully.");
    res.redirect("/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    req.flash("error", "Failed to delete product.");
    res.redirect("/products");
  }
});




//Products Page

app.get("/products", async (req,res)=>{

  try{
 const products = await Product.find({});
  res.render("product.ejs", {title: "Our Products", products});
  }
  catch(err)
  {
    console.error(err);
    req.flash("error", "Failed to load products!");
    res.redirect("/home");
  }
})

//Show individual product

app.get("/products/:id", async(req,res)=>{
  try{
     let {id} = req.params;

     const product = await Product.findById(id);

     if(!product){
      req.flash("error", "Product does not exist!");
      return res.redirect("/products");
     }

     res.render("showProduct.ejs", {title:product.title, product});
  }
 catch(err){
  console.error("Error fetching product by ID: ", err);
  req.flash("error", "Something went wrong");
  res.redirect("/products");
 }

})



//Google Sheets Auth

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Correct env variable name
  null,
  // Replace literal \\n with actual newline characters in the private key
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets'] // scope for editing sheets
);

const sheets = google.sheets({ version: 'v4', auth });


app.post('/submit', async (req, res) => {

   const backURL = req.get('Referer') || '/home';

  try {
    const contact = req.body.contact || {};
    const phone = contact.phone || ''; // Fix: get phone from contact

    const now = new Date();

    const formattedDate = now.toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

    const values = [
      [
        contact.name || '',
        contact.email || '',
        phone,
        contact.inquiryType || '',
        contact.note || '',
         formattedDate
      ],
    ];

    console.log('Appending row:', values);  // Debug

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    await sendEnquiryMail(contact, phone, formattedDate);

    console.log("Form data appended successfully");
    // Send success response to frontend
    req.flash("success", "Thank you for contacting us! We'll get back to you shortly");

    res.redirect(backURL);   //Redirect either back to Home Page/Contact Page
  } catch (error) {
    console.error('Error appending data to Google Sheet:', error);
    req.flash("error", "Something went wrong. Please try again later");
    res.redirect(backURL);
  }
});


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

