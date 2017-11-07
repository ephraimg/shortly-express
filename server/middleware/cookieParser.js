const parseCookies = (req, res, next) => {
  //console.log(req.headers);
  if (req.headers.cookie) {
    req.cookies = {};
    var cookieArray = req.headers.cookie.split('; ').map(cookie => {
      return cookie.split('=');
    });
    cookieArray.forEach(cookie => {
      var cookieKey = cookie[0];
      var cookie = cookie[1];
      req.cookies[cookieKey] = cookie;
    });
  }
  next();
};

module.exports = parseCookies;