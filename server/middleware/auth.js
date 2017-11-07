const models = require('../models');
const Promise = require('bluebird');



module.exports.createSession = (req, res, next) => {
  if (!req.cookies['shortlyid']) {
    // create a new session
    // set new cookie
    return module.exports.setNewCookie(req, res, next);
  } else {
    // check if cookie is valid (it has a session)
    return module.exports.getCookieSession(req, res, next)
      .then(result => {
        // if cookie not valid, clear it and set new cookie
        if (!result) { 
          return module.exports.setNewCookie(req, res, next); 
        } else {          
          // put that session on the req
          req.session = {
            hash: result.hash,
            userId: result.id,
            user: {username: result.user.username}
          };
          next();
        }
      })
      .catch(err => {
        console.error(err);
        next();  
      });
  }  
};


/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.getSessionUser = (req, res, next) => {
  return models.Users.get({id: req.userId})
    .then(record => {
      if (record && record.userId) {
        return record;
      } else {
        return null;
      }
      next();
    });
};

module.exports.getCookieSession = (req, res, next) => {
  var hash = req.cookies['shortlyid'];
  return models.Sessions.get({hash: hash})
    .then(record => {
      if (record && record.userId) {
        return record;
      } else {
        return null;
      }
      next();
    });
};

module.exports.setNewCookie = (req, res, next) => {
  return models.Sessions.create()
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


