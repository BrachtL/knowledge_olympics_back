const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
//todo: check this code

const requireAuth = (req, res, next) => {
  try {
    //const token = req.headers.authorization
    const token = req.headers.token
    if(token) {
      jwt.verify(token, jwtSecret, (err, decodedToken) => {
        if(err) {
          console.log(err.message);
          res.status(500).json({message: "token not valid"}) //todo
        } else {
          console.log("decodedToken: ", decodedToken);
          console.log("DATE NOW: ", Math.floor(Date.now() / 1000));
          req.decodedToken = decodedToken;
          next();
        }
      })
    } else {
      console.log("no token found");
      res.status(500).json({message: "token not valid"}) //todo
    }
  } catch(e) {
    res.status(400).json({message: e.toString()});
  }
}

module.exports = {
  requireAuth
}