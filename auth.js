const passport = require('passport');
const ObjectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
require('dotenv').config();

module.exports = (app, myDatabase) => {
  passport.serializeUser((user, done) => {
    console.log("serializing user");
    console.log(user);
    done(null, user._id);
  });
  
  passport.deserializeUser((id,done) => {
    console.log("deserializing user");
    myDatabase.findOne({_id: new ObjectId(id)}, (err, doc)=> {
      
      if(err) return console.error(err);
      console.log(doc);
      done(null, doc);
    });
  });
  
  passport.use(new LocalStrategy((username, password,done) => {
    myDatabase.findOne({ username: username }, (err, user) => {
      console.log('User '+ username+ ' attempted to log in.');
      if (err) {console.log('error local strategy');return done(err);}
      if(!user) {console.log('no user found local') ;return done(null, false);}
      if (!bcrypt.compareSync(password,user.password)) {console.log("passwords do not match");return done(null, false);}
      console.log("authenticated:");
      console.log(user);
      return done(null, user);
    });
  }));
  
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://guttural-caramel-license.glitch.me/auth/github/callback'
  },(accessToken, refreshToken, profile, cb) =>{
    console.log("github authenticator");
    console.log(profile);
    
    myDatabase.findOneAndUpdate(
      {id: profile.id},
      {
        $setOnInsert: {
          id: profile.id,
          name: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: Array.isArray(profile.emails)
            ? profile.emails[0].value 
            : 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },
      {upsert: true, new: true},
      (err, doc) => {
        return cb(null, doc.value);
      }
    );
  }))
}