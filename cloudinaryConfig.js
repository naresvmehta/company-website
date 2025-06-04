const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "PatilMachines",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

//  Create the multer upload middleware
const upload = multer({ storage });

//  Export both cloudinary and upload
module.exports = {
  cloudinary,
  upload
};
