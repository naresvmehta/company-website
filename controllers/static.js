module.exports.redirectToHome = (req, res) => {
  res.redirect("/home");
};

module.exports.renderHome = (req, res) => {
  res.render("home.ejs", { title: false });
};

module.exports.renderAbout = (req, res) => {
  res.render("about.ejs", { title: "About Us" });
};

module.exports.renderContact = (req, res) => {
  res.render("contact.ejs", { title: "Contact" });
};

