require('dotenv').config();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { ObjectID } = require('mongodb');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function(app, myDataBase) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if (err) return console.error(err);
      done(null, doc);
    });
  });

  //attempted to log  //post a new user register /STRATEGY
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      //check hash password
      if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
      return done(null, user);
    });
  }));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://boilerplate-advancednode.yaveyave.repl.co'
  },
    (accessToken, refreshToken, profile, cb) => {
      //console.log(profile);
      myDataBase.findOneAnUpdate(
      { id: profile.id},
      {
        $setInsert: {
          id: profile.id,
          username: profile.username,
          name: profile.name,
          photo: profile.displayName || 'John Doe',
          email: Array.isArray(profile.emails)
          ? profile.emails[0].value
            : 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },// setInsert
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },//find one and update
        { upsert: true, nre: true },
        (err, doc) =>{
          return cb(null, doc.value)
        }
      )
      
    }
  ));
  
}

