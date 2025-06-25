const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//For Products Cover Image
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "PatilMachines",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

//For Reviews (Client Photos)

const reviewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "PatilMachines/reviews",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

//For Team Photo 

const teamStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "PatilMachines/teams",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});


//  Create the multer upload middleware
const upload = multer({ storage });

const uploadReview = multer({storage: reviewStorage})

const uploadTeam = multer({storage: teamStorage});

//  Export both cloudinary and upload
module.exports = {
  cloudinary,
  upload,
  uploadReview,
  uploadTeam,
};
