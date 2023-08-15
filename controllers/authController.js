const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getUserData, getLocationId, insertLocation,
  getStudentData, getTeacherData } = require('../Database/queries');

//todo: modify signup to sign students in the contest day
module.exports.signup_post = async (req, res) => {
  
  let { email, password, name, age, category, lat, lng, uf, city } = req.body;
  //todo: validate strings email and password: length, special chars, etc. Here and in front-end. Here for security and front for usability
  //done: front end already validates fields
  
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    var locationId = await getLocationId(city, uf);

    if (locationId == 0) {
      locationId = await insertLocation(lat, lng, uf, city);
    }

    if (category == "Sou uma pessoa") {
      category = "person"
    }

    const id = await insertUser(email, hashedPassword, name, age, category, undefined, locationId, undefined);
    //const token = createToken(id);
    console.log("id -> ", id);
    
    res.status(200).json({
        //"token": token
        "message": "Success"
      });
  } catch(e) {
    console.log(e);
    //console.log(e.toString().includes("Duplicate entry") && e.toString().includes("email"));
    res.status(400).json({message: e.toString()});
  }
}

module.exports.login_post = async (req, res) => {
  console.log("LOGIN POST")

  const { name, password, type } = req.body;
  
  try {
    var user;
    if (type == "teacher") {
      user = await getTeacherData(name); //todo: create this function in proper file
    } else {
      user = await getStudentData(name); //todo: create this function in proper file
    }
    

    if(user) {
      console.log("Start bcrypt.compare()");
      const auth = await bcrypt.compare(password, user.password);
      console.log("Finish bcrypt.compare()");
      console.log("AUTH: ", auth);
      if(auth) {
        //send access token to the client
        const token = createToken(user.id, type);
        res.status(200).json({
            token: token
            //todo: does front need some other data to be sent?
          });
      } else {
        throw Error('incorrect password');
      }
    } else {
      throw Error('incorrect email');
    }
    

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}

//todo: change this one too
module.exports.logout_get = async (req, res, decodedToken) => {
  
  //const token = req.headers.token;

  try {
    console.log("I am here");
    //const isSuccess = insertTokenInBlacklist(token); //todo
    console.log(req.decodedToken);

  } catch(e) {

  }
}


function createToken(id, type) {
  return jwt.sign({id: id, type: type}, jwtSecret, {
    expiresIn: 30 * 60 //30 min in secs //todo: change this expiresIn to
    //test duration time + 15min for students or "forever" for teachers? 
  });
}