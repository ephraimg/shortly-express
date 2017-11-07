const models = require('../models');
const Promise = require('bluebird');



module.exports.createSession = (req, res, next) => {
  if (req.cookies['shortlyid']) {
    req.session = req.session || {};
    // grab the hash
    var hash = req.cookies['shortlyid'];
    // lookup session in table using hash
    // console.log('\n------------ hash: ', hash);
    models.Sessions.get({hash: hash})
      .then(record => {
        if (record) {
          req.session.hash = record.hash;
          // if there's associated userid, get the user
          if (!record.userId) {
            return module.exports.rebuildSession(req, res, next);
          } else {
            models.Users.get({id: record.userId})
              .then(user => {
                // attach userid, username to session
                req.session.userId = user.id;
                req.session.user = {username: user.username};
                next();
              })
              .catch(err => {
                console.error(err);
                next();  
              });
          }
        }
      });
  }    
};


module.exports.rebuildSession = (req, res, next) => {
  models.Sessions.create()
    .then(result => {
      return models.Sessions.get({id: result.insertId});
    })
    .then(session => {
      req.session = session;
      res.cookies['shortlyid'] = {value: req.session.hash};
      next();
    })
    .catch(err => {
      console.log(err);
      next();
    });  
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


