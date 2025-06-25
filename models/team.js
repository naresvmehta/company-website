const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSchema = new Schema({
  coverImage: {
    url: String,
    filename: String,
  },
  department: {
    type: String,
    trim: true,
    default: "",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
}, { timestamps: true });

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
