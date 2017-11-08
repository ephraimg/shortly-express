const models = require('../models');
const Promise = require('bluebird');


module.exports.createSession = (req, res, next) => {
  if (!req.cookies || !req.cookies['shortlyid']) {
    // create a new session
    // set new cookie
    module.exports.setNewCookie(req, res, next);
  } else {
    // check if cookie is valid (it has a session)
    return module.exports.getCookieSession(req, res, next)
      .then(session => {
        // if cookie not valid, clear it and set new cookie
        if (!session) { 
          module.exports.setNewCookie(req, res, next); 
        } else {          
          // put that session on the req
          req.session = session;
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

module.exports.verifySession = (req, res, next) => {
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else {
    next();
  }
};

module.exports.getCookieSession = (req, res, next) => {
  var hash = req.cookies['shortlyid'];
  return models.Sessions.get({hash: hash})
    .then(record => {
      if (record) {
        return record;
      } else {
        return null;
      }
    });
};

module.exports.setNewCookie = (req, res, next) => {
  return models.Sessions.create()
    .then(result => {
      return models.Sessions.get({id: result.insertId});
    })
    .then(session => {
      req.session = session;
      res.cookie('shortlyid', session.hash);
      next();
    })
    .catch(err => {
      console.log(err);
      next();
    });  
};

module.exports.signUpUser = (req, res) => {
  return models.Users.get({username: req.body.username})
    .then(user => {
      console.log('auth 80, user: ', JSON.stringify(user));
      if (user) {
        res.redirect('/signup');
      } else {
        let user = req.body;
        models.Users.create(user)
          .then(results => {
            return models.Sessions.update({ hash: req.session.hash }, { userId: results.insertId });
          })
          .then(() => res.redirect('/'));
      }
    })
    .catch(err => res.status(500).send(err));
};

module.exports.loginUser = (req, res, next) => {
  return models.Users.get({username: req.body.username})
    .then(user => {
      if (!user || !models.Users.compare(req.body.password, user.password, user.salt)) { 
        res.redirect('/login'); 
      } else {
        // how do we know there's a req.session?
        return models.Sessions.update({ hash: req.session.hash }, { userId: user.id })
          .then(() => {
            res.redirect('/');
          })
          .catch(err => {
            res.status(500).send(err);
          });
      }
    })
    .catch(err => {
      res.redirect('/login');
    });
};

module.exports.logoutUser = (req, res) => {
  return models.Sessions.delete({hash: req.cookies.shortlyid})
    .then(() => {
      res.clearCookie('shortlyid');
      res.redirect('/login');
    })
    .error(error => {
      res.status(500).send(error);
    });
};


