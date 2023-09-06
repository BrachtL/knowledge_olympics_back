//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMineLikedDisliked, setLikeRelation, setDislikeRelation, getSecondaryImagesURL,
  getLikedPets, getTeacherData, getTeacherQuestionsPageData, updateQuestions, getExamPageQuestionsData,
  getExamPageStudentData, updateExamOptions, getStudentOptions, createStudentOptions } = require('../Database/queries');

//todo: change post method here and in frontend to patch (or put)
module.exports.exam_post = async (req, res) => {
  try {
    const userId = req.decodedToken.id;
    console.log("checkpoint 00005: ", JSON.stringify(req.body));

    const message = await updateExamOptions(userId, req.body);

    //todo: set a db student's var (I have to create it) to finished, then the answers can't be change anymore

    res.status(200).json({
      message: message
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
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
      questionsArray: questionsArray,
      userId: userId
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
    
    const studentData = await getExamPageStudentData(userId);
    const questionsData = await getExamPageQuestionsData(userId);

    const areOptionsCreated = await getStudentOptions(userId, questionsData);
    console.log("checkpoint 00008: ", areOptionsCreated);
    if(areOptionsCreated == 0) {
      console.log("checkpoint 00009")
      const createOptions = await createStudentOptions(userId, questionsData);
    }

    console.log(`studentData = ${JSON.stringify(studentData)}`);
    //console.log(`studentData length = ${studentData.length}`);

    console.log(`questionsData = ${JSON.stringify(questionsData)}`);
    console.log(`questionsData length = ${questionsData.length}`);

    var questionsArray = [];
    var orderedQuestionsArray = [];
    var mediasArray = [];


    var mediaOtherArray = [];
    var mediaAudioArray = [];
    
    
    for (let k = 0; k < questionsData.length; k++) {
      const questionObject = {}; // Create an object for each question
      questionObject.questionText = questionsData[k].question;
      questionObject.options = shuffleArray([
        questionsData[k].correct_answer, questionsData[k].wrong_answer_1, questionsData[k].wrong_answer_2,
        questionsData[k].wrong_answer_3, questionsData[k].wrong_answer_4
      ]);

      questionObject.id = questionsData[k].id;

      questionObject.media_type = questionsData[k].media_type;
      questionObject.media_name = questionsData[k].media_name;
      questionObject.media_text = questionsData[k].media_text;
      questionObject.media_url = questionsData[k].media_url;
      console.log(`code 00001: `, questionObject.media_type, questionObject.media_name);
      //todo: add what more is needed

      if(questionObject.media_type != "no") {
        //todo: I have to assure that front check media_name length 3 or more
        //before send to api to send to DB
        if(questionObject.media_type == "audio") {
          if (!mediaAudioArray.some(media => media.media_name == questionObject.media_name)) {
            mediaAudioArray.push({
              media_name: questionObject.media_name,
              media_type: questionObject.media_type    
            });
          } 
        } else {
          if (!mediaOtherArray.some(media => media.media_name == questionObject.media_name)) {
            mediaOtherArray.push({
              media_name: questionObject.media_name,
              media_type: questionObject.media_type    
            });
          }
        }
      } else {
        questionObject.media_name = '';
        if(!mediaOtherArray.some(media => media.media_type == "no")) {
          mediaOtherArray.push({
            media_name: '',
            media_type: "no"
          });
        }
      }
      
      //questionObject.number = k+1; //todo: use index in front
      questionsArray.push(questionObject);
    }

    //even starts with Audio
    mediaAudioArray = shuffleArray(mediaAudioArray);
    mediaOtherArray = shuffleArray(mediaOtherArray);
    if((userId % 2) == 0) {
      for(let k = 0; k < mediaAudioArray.length; k++) {
        mediasArray.push(mediaAudioArray[k]);
      }

      for(let k = 0; k < mediaOtherArray.length; k++) {
        mediasArray.push(mediaOtherArray[k]);
      }
      
      //mediasArray.push(mediaAudioArray);
      //mediasArray.push(mediaOtherArray);
    } else {
      for(let k = 0; k < mediaOtherArray.length; k++) {
        mediasArray.push(mediaOtherArray[k]);
      }

      for(let k = 0; k < mediaAudioArray.length; k++) {
        mediasArray.push(mediaAudioArray[k]);
      }


      //mediasArray.push(mediaOtherArray);
      //mediasArray.push(mediaAudioArray);
    }

    console.log(`code 00002: mediasArray: `, JSON.stringify(mediasArray));

    questionsArray = shuffleArray(questionsArray); 
    
    console.log(`code 00003: questionsArray: `, JSON.stringify(questionsArray));
    
    //let i = 0;

    for(let k = 0; k < mediasArray.length; k++) {

      let isFirstMedia = true;

      for(let i = 0; i < questionsArray.length; i++) {
        if(questionsArray[i].media_name == mediasArray[k].media_name) {
          questionsArray[i].number = orderedQuestionsArray.length + 1;
          questionsArray[i].isFirstMedia = isFirstMedia;
          isFirstMedia = false;
          orderedQuestionsArray.push(questionsArray[i]);
          console.log(`k = ${k} and i = ${i}`);
          console.log(`media_name: ${questionsArray[i].media_name}`);
          console.log(`media_type questionsArray: ${questionsArray[i].media_type}`);
          console.log(`media_type orderedQuestionsArray: ${JSON.stringify(orderedQuestionsArray)}`);
          questionsArray.splice(i,1);
          i--;
          //continue;
        }
        //i++;
      }
      //i = 0;
    }

    const questionsPageData = {
      studentName: studentData.name,
      classroom: studentData.classroom,
      numberId: studentData.number,
      school: studentData.school,
      questionsArray: orderedQuestionsArray,
      userId: userId
    }

    console.log(JSON.stringify(questionsPageData));

    res.status(200).json(questionsPageData);   

  } catch(e) {
    console.log(e.toString());
    res.status(400).json({message: e.toString()});
  }
}

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


