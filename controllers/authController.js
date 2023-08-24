const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getUserData, getLocationId, insertLocation,
  getStudentData, setStudentData, getTeacherUserData } = require('../Database/queries');

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

  let { name, password, type, birthdate, numberId, classroom, school } = req.body;
  
  try {
    if (type == "teacher") {
      let user = await getTeacherUserData(name);
      if(user) {
        console.log("Start bcrypt.compare()");
        const auth = await bcrypt.compare(password, user.password);
        console.log("Finish bcrypt.compare()");
        console.log("AUTH: ", auth);
        if(auth) {
          //send access token to the client
          const token = createToken(user.id, type);
          console.log(`${type} ${name} logged`);
          res.status(200).json({
              token: token
            });
        } else {
          throw Error('incorrect password');
        }
      } else {
        throw Error('incorrect email');
      }
    } else {
      let user = await getStudentData(name);
      if(user) {
        const token = createToken(user.id, type);
        console.log(`${type} ${name} logged`);
        res.status(200).json({
          token: token
        });
        
      } else {
        //todo: use the setStudentData here and make res.status(200).json()
        let userId = await setStudentData(name, birthdate, numberId, classroom, school);
        const token = createToken(userId, type);
        console.log(`${type} ${name} logged`);
        res.status(200).json({
          token: token
        });


        //throw Error('incorrect email'); //todo: change this error message. It will probably be something like: user already logged in 
      }
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
  let expirationTime;
  if(type == "teacher") {
    expirationTime = 5184000 //2 months
  } else {
    expirationTime = 7200 //2 hours (exam duration) todo: check it, maybe it will be 1h45m
  }
  console.log(`${type} token created with ${expirationTime}`);
  return jwt.sign({id: id, type: type}, jwtSecret, {
    expiresIn: expirationTime 
  });
}