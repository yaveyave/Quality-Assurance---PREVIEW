const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
  //ROUTE
  
  //chat pug render
  app.route('/chat').get(ensureAuthenticated, (req, res)=>{
    res.render('profile', {user: req.user});
  });
  
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  // accpet a POST request
  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });

  //render porfile.pug
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', {
      username: req.user.username
    });
  });

  //loggin a user out
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  // REGISTER A NEW USER
  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          //hash a password
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                next(null, doc.ops[0]);
              }
            }
          )
        }
      })
    },
      passport.authenticate('local', { failtureRedirect: '/' }), (req, res, next) => {
        res.redirect('/profile');
      });


  // GITHUB AUTHENTICATIONS
  app.route('/auth/github').get(passport.authenticate('github'));
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect("/chat");
  });
  //handeling 404 pages
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}

//function ensure
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};
