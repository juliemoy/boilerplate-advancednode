const bcrypt = require('bcrypt');
const passport = require('passport');

module.exports = function (app, myDatabase) {
    app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Connected to Database', 
      message: 'Please login', 
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });
  
  app.route('/chat')
  .get(ensureAuthenticated,(req,res)=>{
    res.render('pug/chat.pug', {
      user: req.user
    })
  });
  
  app.route('/auth/github')
  .get(passport.authenticate('github'));
  
  app.route('/auth/github/callback')
  .get(passport.authenticate('github',{failureRedirect: '/'}), (req,res)=>{
    req.session.user_id = req.user.id;
    res.redirect('/chat');
  });
  
    app.route('/register')
  .post((req,res,next)=>{
      console.log('trying to register');
    myDatabase.findOne({username: req.body.username}, (err, user)=>{
      if(err) {console.log("error in register");next(err)}
      else if (user) {console.log("register: user found");res.redirect('/')}
      else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        
        myDatabase.insertOne({
          username: req.body.username,
          password: hash
        },(err,doc)=>{
          if(err) {console.log("error inserting into database");res.redirect('/')}
          else next(null, doc.ops[0]);
        })
      }
    })
  },
    passport.authenticate('local', {failureRedirect: '/'}),
        (req,res, next) => {
      res.redirect('/profile');
    }
  );
  
  app.route('/failure')
  .get((req,res)=> {
    res.send('failed to log in');
  })
  
    app.route('/login')
    .post(passport.authenticate(
      'local',
      {
        failureRedirect: '/failure'
      }),
      (req,res)=> {
      console.log("LOGIN REDIRECTING TO /PROFILE");
        res.redirect('/profile');
  });
  
  app.route('/profile').get(ensureAuthenticated, (req,res)=> {
    res.render('pug/profile.pug', {username: req.user.username});
  });
  
    app.route('/logout')
  .get((req,res) => {
    req.logout();
    res.redirect('/');
  });
  
    app.use((req, res, next)=> {
    res.status(404)
    .type('text')
    .send('Not Found');
  });
  

}
 
function ensureAuthenticated(req,res,next){
    console.log('ensuring authentication');
  if(req.isAuthenticated()) {
    console.log("authentication ensured");
    return next();
  }
  console.log('authentication failure. redirecting home');
  res.redirect('/');
}