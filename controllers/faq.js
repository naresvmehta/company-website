const FAQ=require("../models/faq.js");

//FAQ PAGE

module.exports.renderFaq = async(req,res)=>{
    try{
        const faqs = await FAQ.find({});
        res.render("faq.ejs", {pgTitle: "FAQs – Soap, Detergent & Chemical Plant Machinery Queries | Patil Machines Pvt Ltd",
metaDescription: "Get answers to common questions about our machinery, project handling, services, installation support, and manufacturing capabilities at Patil Machines Pvt. Ltd."
,faqs, title:"FAQ"});
    }
    catch(err){
        console.log(err);
        req.flash("error", "Error fetching FAQs");
        res.redirect("/home");
    }
}



//Display Add FAQ Form

module.exports.renderAddFaqForm = (req,res) => {
    res.render("addFaq.ejs", {isAdminPage: true, title: "Add New FAQ"});
}


//Add NEW FAQ

module.exports.AddFaq = async(req,res) => {
try{
    const {question, answer} = req.body;
    
    const newFAQ = new FAQ({question,answer});
    await newFAQ.save();

    req.flash("success", "NEW FAQ added successfully!");
    res.redirect("/faq");

}catch(err){
    req.flash("error", "Error adding FAQ");
    console.log("Error in adding FAQ : ", err);
    res.redirect("/faq");
}
}


//Display Edit FAQ Form

module.exports.renderEditFaqForm = async(req,res) =>{
    try{

    
    const {id} = req.params;
    
    const faq = await FAQ.findById(id);

    if(!faq){
        req.flash("error", "FAQ not found!");
        return res.redirect("/faq");
    }

    res.render("editFaq.ejs", {isAdminPage: true, title:"Edit FAQ", faq});
}
catch(err){
    cosnole.log(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/faq");
}
}

//Edit FAQ Form

module.exports.editFAQ = async(req,res) => {
    try{
    const {id} = req.params;

    const faq = await FAQ.findById(id);

    if(!faq){
        req.flash("error", "FAQ not found!");
        return res.redirect("/faq");
    }
 
    const {question, answer} = req.body;
    faq.question = question;
    faq.answer = answer;

    await faq.save();

    req.flash("success", "FAQ updated successfully!");
    res.redirect("/faq");


}catch(err){
    console.log("Error in updating FAQ: ", err);
    req.flash("error", "Error in updating FAQ");
    res.redirect("/faq");
}   
}

//DELETE FAQ

module.exports.deleteFAQ = async(req,res) => {
    try{
    let {id} = req.params;

    const faq = await FAQ.findById(id);

    if(!faq){
     req.flash("error", "FAQ not found!");
     return res.redirect("/faq");
    }

    await FAQ.findByIdAndDelete(id);
    req.flash("success", "FAQ deleted successfully!");
    res.redirect("/faq");

    }
    catch(err){
        console.log("Error in deleting FAQ: ", err);
        req.flash("error", "Error in deleting FAQ");
        res.redirect("/faq");
    }
}




