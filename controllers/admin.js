module.exports.renderLoginPage = (req, res) => {
  res.render("login.ejs");
};

module.exports.login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    req.flash("success", "Welcome back Admin!");
    return res.redirect("/home");
  }

  req.flash("error", "Invalid Login Credentials");
  res.redirect("/login");
};

module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      return res.redirect('/login');
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.redirect('/home');
  });
};
