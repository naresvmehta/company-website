const Product = require("../models/product.js");
const {cloudinary} = require("../cloudinaryConfig.js");
const mongoose = require("mongoose");

const { extractPublicIds } = require("../utils/cloudinaryHelper");


// Products Page
module.exports.index = async (req, res) => {
  try {
    const products = await Product.find({});
    res.render("product.ejs", { title: "Our Products", products });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load products!");
    res.redirect("/home");
  }
};




// Render Add Product Form
module.exports.renderAddProductForm = (req, res) => {
  res.render("addProduct.ejs", { title: "Add New Products" });
};




// Create New Product
module.exports.createProduct = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error", "Cover image is required.");
      return res.redirect("/products/add");
    }

    const { title, description } = req.body;
    const coverImage = {
      url: req.file.path,
      filename: req.file.filename
    };

    const product = new Product({ title, description, coverImage });

  //Lazy Load Description Images to save Cloudinary Bandwidth
  product.description = product.description?.replace(
  /<img(?![^>]*loading=)[^>]*?>/gi,
  (imgTag) => imgTag.replace('<img', '<img loading="lazy"')
);

    await product.save();

    req.flash("success", "New product added successfully!");
    res.redirect("/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add plant. Please try again.");
    res.redirect("/products/add");
  }
};




// Show Single Product
module.exports.showProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid product ID");
      return res.redirect("/products");
    }

    const product = await Product.findById(id);
    if (!product) {
      req.flash("error", "Product does not exist!");
      return res.redirect("/products");
    }

    res.render("showProduct.ejs", { title: product.title, product });
  } catch (err) {
    console.error("Error fetching product by ID: ", err);
    req.flash("error", "Something went wrong");
    res.redirect("/products");
  }
};




// Render Edit Form
module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/products");
    }

    res.render("editProduct.ejs", { title: "Edit Form", product });
  } catch (err) {
    console.error("Error in opening the Edit Form", err);
    req.flash("error", "Something went wrong. Please try again later");
    res.redirect(`/products/${req.params.id}`);
  }
};




// Update Product
module.exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/products");
    }

    // Save old description before update
    const oldDescription = product.description || "";

    product.title = title;
    product.description = description;

    if (req.file) {
      await cloudinary.uploader.destroy(product.coverImage.filename);
      product.coverImage = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    // Compare old and new descriptions
    const oldImageIds = extractPublicIds(oldDescription);
    const newImageIds = extractPublicIds(description || "");
    const unusedImageIds = oldImageIds.filter(id => !newImageIds.includes(id));

    for (let publicId of unusedImageIds) {
      await cloudinary.uploader.destroy(publicId);
    }

  //Lazy Load Description Images to save Cloudinary Bandwidth
  product.description = product.description?.replace(
  /<img(?![^>]*loading=)[^>]*?>/gi,
  (imgTag) => imgTag.replace('<img', '<img loading="lazy"')
);
    await product.save();
    req.flash("success", "Product details updated successfully");
    res.redirect(`/products/${id}`);

  } catch (err) {
    console.error("Error updating product:", err);
    req.flash("error", "Failed to update product");
    res.redirect(`/products/${id}`);
  }
};





// Render Delete Confirmation
module.exports.renderDeleteForm = async (req, res) => {
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
};



// Delete Product

module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }

    // 1. Delete cover image
    if (product.coverImage?.filename) {
      await cloudinary.uploader.destroy(product.coverImage.filename);
    }

    // 2. Extract and delete description images
    const publicIds = extractPublicIds(product.description || "");
    for (let publicId of publicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    // 3. Delete product from DB
    await Product.findByIdAndDelete(id);

    req.flash("success", "Product deleted successfully.");
    res.redirect("/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    req.flash("error", "Failed to delete product.");
    res.redirect("/products");
  }
};



// CKEditor Image Upload
module.exports.uploadDescriptionImage = async (req, res) => {
  try {

      // Check if a file is actually provided
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ uploaded: false, error: { message: "No file uploaded." } });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "PatilMachines/Description" },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ uploaded: false, error: { message: "Upload failed." } });
        }

        return res.json({
          uploaded: true,
          url: result.secure_url,
          default: result.secure_url
        });
      }
    );
    stream.end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ uploaded: false, error: { message: err.message } });
  }
};
