//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMineLikedDisliked, setLikeRelation, setDislikeRelation, getSecondaryImagesURL, getLikedPets,
  getTeacherData, getTeacherQuestionsPageData, updateQuestions } = require('../Database/queries');


module.exports.exam_get = async (req, res) => {

}

module.exports.exam_post = async (req, res) => {

}

module.exports.answer_post = async (req, res) => {

}

//todo: use req.decodedToken.type to check if it is a teacher, if it is not -> deny access
//todo: use this type in every get and post request here
module.exports.questions_get = async (req, res) => {
  try {
    const userId = req.decodedToken.id;
    const data = await getTeacherQuestionsPageData(userId);
    console.log(data[0]);
    console.log(`data length = ${data.length}`);

    var questionsArray = [];
    
    for (let k = 0; k < data.length; k++) {
      const questionObject = {}; // Create an object for each question
      questionObject.id = data[k].id;
      questionObject.question = data[k].question;
      questionObject.correct_answer = data[k].correct_answer;
      questionObject.wrong_answer_1 = data[k].wrong_answer_1;
      questionObject.wrong_answer_2 = data[k].wrong_answer_2;
      questionObject.wrong_answer_3 = data[k].wrong_answer_3;
      questionObject.wrong_answer_4 = data[k].wrong_answer_4;
      questionObject.number = k+1;
      questionObject.media_type = data[k].media_type == null || data[k].media_type == "null" ? "" : data[k].media_type;
      questionObject.media_name = data[k].media_name == null || data[k].media_name == "null" ? "" : data[k].media_name;
      questionObject.media_url = data[k].media_url == null || data[k].media_url == "null" ? "" : data[k].media_url;
      questionObject.media_source = data[k].media_source == null ||data[k]. media_source == "null" ? "" : data[k].media_source;
      questionsArray.push(questionObject); // Add the question object to the array
    }

    const questionsPageData = {
      teacherName: data[0].name,
      subject: data[0].subject, // considering each teacher has just one subject
      questionsArray: questionsArray
    }

    res.status(200).json(questionsPageData);   

  } catch(e) {
    console.log(e.toString());
    res.status(400).json({message: e.toString()});
  }
}


//todo: I will use the for loop there probably
module.exports.exam_get = async (req, res) => {
  try {
    const userId = req.decodedToken.id;
    const data = await getTeacherQuestionsPageData(userId);
    console.log(data[0]);
    console.log(`data length = ${data.length}`);

    var questionsArray = [];
    
    for (let k = 0; k < data.length; k++) {
      const questionObject = {}; // Create an object for each question
      questionObject.question = data[k].question;
      questionObject.alternatives = shuffleArray([
        data[k].correct_answer, data[k].wrong_answer_1, data[k].wrong_answer_2,
        data[k].wrong_answer_3, data[k].wrong_answer_4
      ]);
      questionObject.number = k+1;
      questionsArray.push(questionObject); // Add the question object to the array
    }

    const questionsPageData = {
      teacherName: data[0].name,
      subject: data[0].subject, // considering each teacher has just one subject
      questionsArray: questionsArray
    }

    res.status(200).json(questionsPageData);   

  } catch(e) {
    console.log(e.toString());
    res.status(400).json({message: e.toString()});
  }
}

//todo: change it here and in frontend to update method
module.exports.questions_post = async (req, res) => {
  try {
    const userId = req.decodedToken.id;

    const message = await updateQuestions(userId, req.body);

    res.status(200).json({
      message: message
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}




module.exports.pets_get = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petsList = await getPetsExceptMineLikedDisliked(userId);
    console.log(petsList[0]);
    console.log(`petsList length = ${petsList.length}`);
    
    await getUrlsAndFormatBirthday(petsList);
    console.log("after forEach: ", petsList[10]);
    console.log(`after forEach: petsList length = ${petsList.length}`);

    res.status(200).json({
      petsList: petsList
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}

//todo: use try catch here is probably a good idea
async function getUrlsAndFormatBirthday(petsList) {
  const promises = petsList.map(async (element) => {
    element.secondary_images_URL = await getSecondaryImagesURL(element.id);

    const date = new Date(element.birthday);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    //element.birthday = formattedDate.replace(/-/g, "/");
    element.birthday = formattedDate;
    return element;
  });

  // Wait for all promises to resolve
  return Promise.all(promises);
}


//todo: implement this function
module.exports.like_pet_post = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`LIKE petId -> ${petId}`);

    const insertId = await setLikeRelation(userId, petId);

    res.status(200).json({
      message: "Success"
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.dislike_pet_post = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`DISLIKE petId -> ${petId}`);

    const insertId = await setDislikeRelation(userId, petId);

    res.status(200).json({
      message: "Success"
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}


module.exports.pets_grid_get = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petsLikedList = await getLikedPets(userId);
    console.log(petsLikedList[0]);
    console.log(`petsLikedList length = ${petsLikedList.length}`);
    
    await getUrlsAndFormatBirthday(petsLikedList);
    console.log("after forEach: ", petsLikedList[0]);
    console.log(`after forEach: petsLikedList length = ${petsLikedList.length}`);

    res.status(200).json({
      petsList: petsLikedList
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }


}

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }


