const Team = require("../models/team.js");

const {cloudinary} = require("../cloudinaryConfig.js");
const mongoose = require("mongoose");

//Render Add Team Photo Form

module.exports.renderAddTeamPhotoForm = (req,res) =>{
    res.render("addTeam.ejs", {isAdminPage:true, title:"Add Team Photo"});
}

//Add Team Photo Form

module.exports.addTeamPhoto = async (req, res) => {
  try {
    const { department, description } = req.body;

    // Team photo is required
    if (!req.file) {
      req.flash('error', 'Team photo is required.');
      return res.redirect('/teams/add');
    }

    const teamData = {
      coverImage: {
        url: req.file.path,         // Cloudinary URL
        filename: req.file.filename // Cloudinary public ID
      },
      department,
      description
    };

    const team = new Team(teamData);

    try {
      await team.save(); // Try saving to MongoDB
    } catch (saveErr) {
      // If DB save fails, remove image from Cloudinary
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cloudErr) {
        console.error('Failed to delete uploaded image after DB save failed:', cloudErr);
      }

      throw saveErr;
    }

    req.flash('success', 'Team photo added successfully!');
    res.redirect('/home'); 

  } catch (err) {
    console.error('Error adding team photo:', err);
    req.flash('error', 'Failed to upload team photo. Please try again');
    res.redirect('/teams/add');
  }
};

//Render Team Edit Page

module.exports.renderEditTeamPhotoForm = async(req,res) => {
try{
    const {id} = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
          req.flash("error", "Invalid team photo ID");
          return res.redirect("/home");
        }

    const team = await Team.findById(id);

    if(!team){
        req.flash("error", "Team Photo not found!");
       return res.redirect("/home");
    }

    res.render("editTeam.ejs", {isAdminPage:true, team, title: "Edit Team Photo" });
}
catch(err){
    console.error("Error in fetching Team Photo: ", err);
    req.flash("error", "Error in fetching Team Photo");
    res.redirect("/home");
}
}

//Edit Team Photo

module.exports.editTeamPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      req.flash('error', 'Team Photo not found');
      return res.redirect('/home');
    }

    // Update basic fields
    team.department = req.body.department || '';
    team.description = req.body.description || '';

    // If a new image was uploaded
    if (req.file) {
      // Delete the old image from Cloudinary
      if (team.coverImage?.filename) {
        try {
          await cloudinary.uploader.destroy(team.coverImage.filename);
        } catch (cloudErr) {
          console.error('Failed to delete old image from Cloudinary:', cloudErr);
          req.flash('error', 'Old image could not be removed from Cloudinary.');
        }
      }

      // Set the new image
      team.coverImage = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    // Save the updated team document
    await team.save();
    req.flash('success', 'Team photo updated successfully!');
    res.redirect('/home');

  } catch (err) {
    console.error('Error updating team photo:', err);
    req.flash('error', 'Something went wrong while updating the team photo.');
    res.redirect('/home');
  }
};

//Delete Team Photo

module.exports.deleteTeamPhoto = async(req,res) =>{
  try{
    const {id} = req.params;
    const team = await Team.findById(id);

    if(!team){
      req.flash("error", "Team Photo not found!");
      return res.redirect("/home");
    }
    
    //Delete the current image from cloudinary
    if(team.coverImage?.filename){
      try{
       await cloudinary.uploader.destroy(team.coverImage.filename);
      }catch(cloudErr){
        console.error("Error in deleting Team Photo: ", cloudErr);
        req.flash('error', 'Team Photo could not be removed from Cloudinary');
      }
      }
    
      await Team.findByIdAndDelete(id);
      req.flash("success", "Team Photo deleted successfully!");
      res.redirect("/home");
}
catch(err){
    console.error("Error in deleting Team Photo: ", err);
    req.flash("error", "Failed to delete Team Photo");
    res.redirect("/home");
  }
}
