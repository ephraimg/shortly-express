const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.signUpUser = (req, res, next) => {
  models.Users.get({username: req.body.username})
    .then(result => {
      if (result !== undefined) {
        res.redirect('/signup');
      } else {
        let user = req.body;
        models.Users.create(user)
          .then(() => res.redirect('/'));
      }
    });
};

module.exports.loginUser = (req, res, next) => {
  models.Users.get({username: req.body.username})
    .then(user => {
      if (!user) { 
        res.redirect('/login'); 
      } else {
        req.body.password = req.body.password || '';
        if (models.Users.compare(req.body.password, user.password, user.salt)) {
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      }
    })
    .catch(err => console.log('Login error: ', err));
};


