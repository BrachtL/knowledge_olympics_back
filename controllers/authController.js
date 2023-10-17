const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getUserData, getLocationId, insertLocation,
  getStudentData, setStudentData, getTeacherUserData, getPeriodCodes } = require('../Database/queries');


module.exports.match_cookie_post = async (req, res, decodedToken) => {
  try {
    console.log("checkpoint 00010");
    console.log(req.decodedToken.id);
    console.log(req.body.userId);

    if(req.decodedToken.id == req.body.userId && req.decodedToken.type == req.body.type) {
      res.status(200).json({
        //"token": token
        "message": "Success"
      });
    } else {
      res.status(401).json({
        //"token": token
        "message": "match fail"
      });
    }

  } catch(e) {
    console.log(e);
    //console.log(e.toString().includes("Duplicate entry") && e.toString().includes("email"));
    res.status(400).json({message: e.toString()});
  }
}

module.exports.login_post = async (req, res) => {
  console.log("LOGIN POST")

  let { name, password, type, birthdate, numberId, classroom, school, code, logTo } = req.body;
  
  try {
    if (type == "teacher") {
      let user = await getTeacherUserData(name);
      if(user) {
        //console.log("Start bcrypt.compare()");
        const auth = await bcrypt.compare(password, user.password);
        //console.log("Finish bcrypt.compare()");
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
        throw Error('incorrect user');
      }
      //todo: remove this stats block?
    } else if(type == "student" && logTo == 'exam') {
      let user = await getStudentData(name);
      if(user && !user.is_started) {
        const token = createToken(user.id, type);
        console.log(`${type} ${name} logged`);
        res.status(200).json({
          token: token
        });
        
      } else {
        //todo: use the setStudentData here and make res.status(200).json()

        if(user && user.is_started) {
          throw Error('Este usuário já está realizando a prova!');
        }

        let period;
        let isActive = 0;
        if(code == process.env.OLYMPICS_PERIOD1) {
          isActive = (await getPeriodCodes()).period1;
          if(isActive == 0) {
            throw Error('Acesso negado: aguarde o horário da prova!')
          }
          period = 1;
        } else if(code == process.env.OLYMPICS_PERIOD2) {
          isActive  = (await getPeriodCodes()).period2;
          if(isActive == 0) {
            throw Error('Acesso negado: aguarde o horário da prova!')
          }
          period = 2;
        } else if(code == process.env.OLYMPICS_MASTER) {
          period = -1
        } else {
          throw Error('Acesso negado: identificador inválido');
        }
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        let userId = await setStudentData(name, birthdate, numberId, classroom, school, period, hashedPassword);
        const token = createToken(userId, type);
        console.log(`${type} ${name} logged`);
        res.status(200).json({
          token: token
        });
        
        //throw Error('incorrect email'); //todo: change this error message. It will probably be something like: user already logged in 
      }
    } else if(type == "student" && logTo == 'stats') {
      let user = await getStudentData(name);
      if(user) {
        //console.log("Start bcrypt.compare()");
        const auth = await bcrypt.compare(password, user.password);
        //console.log("Finish bcrypt.compare()");
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
        throw Error('incorrect user');
      }
    } 
    

  } catch(e) {
    console.log(e.toString());
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
  //console.log(`${type} token created with ${expirationTime}`);
  return jwt.sign({id: id, type: type}, jwtSecret, {
    expiresIn: expirationTime 
  });
}