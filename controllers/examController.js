//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getTeacherData, getTeacherQuestionsPageData, updateQuestions, getExamPageQuestionsData,
  getExamPageStudentData, updateExamOptions, getStudentOptions, createStudentOptions, setFinish,
  getStudentAnswers, getRightAnswers, getStudentsAnswers, setRightAnswersAmount, setStudentsHitsById,
  getStatsPoints, setStatsPoints, getStudentNames, getStatsData, getStatsPageQuestionsData, 
  getStudentAnswersById, getTeacherName } = require('../Database/queries');


module.exports.stats_data_get = async (req, res) => {
  try {
    
    const userId = req.decodedToken.id;
    let name = '';
    let answers = [];
    let answersKV = [];
    const statsData = await getStatsData();
    console.log(JSON.stringify(statsData));
    console.log(`statsData length = ${statsData.length}`);
  
    let questionsData = await getStatsPageQuestionsData();
    console.log("questionsData: \n", JSON.stringify(questionsData));

    for (let k = 0; k < questionsData.length; k++) {
      //questionsData.questionText = questionsData[k].question;
      questionsData[k].options = [
        questionsData[k].correct_answer, questionsData[k].wrong_answer_1, questionsData[k].wrong_answer_2,
        questionsData[k].wrong_answer_3, questionsData[k].wrong_answer_4
      ];
      questionsData[k].number = statsData[k].id;
      questionsData[k].questionText = questionsData[k].question;
      answers[k] = {
        id_questions: questionsData[k].id, 
        answer: questionsData[k].correct_answer
      }
    }


    if(req.decodedToken.type == "student") {
      answers = await getStudentAnswersById(userId);
      console.log(`studentAnswers(${userId}): \n`, JSON.stringify(answers));
      name = await getStudentNames([userId]);
      name = name[0].name;
      console.log("student name is: ", name);
      answersKV = answers.reduce((acc, item) => {
        acc[item.id_questions] = item.answer;
        return acc;
      }, {});
    } else if(req.decodedToken.type == "teacher") {
      name = await getTeacherName(userId);
      console.log("teacher name is: ", name);
      answersKV = answers.reduce((acc, item) => {
        acc[item.id_questions] = item.answer;
        return acc;
      }, {});
    }

    console.log("answersKV: ", answersKV);
    
    const statsPageData = {
      name: name,
      questionsData: questionsData,
      markedOptions: answersKV,
      statsData: statsData,
      userId: userId
    }

    res.status(200).json(statsPageData);

  } catch (e) {
    console.log(e.toString());
    res.status(400).json({ message: e.toString() });
  }
}


module.exports.check_results_post = async (req, res) => {
  try {
    const password = req.body.password;

    if(password != process.env.OLYMPICS_STATS_PASSWORD) {
      res.status(400).json({ message: "wrong password" });
      return;
    }

    //get rightAnswers from questions table (id, correct_answer, right_counter)
    let rightAnswers = await getRightAnswers();

    for(let k = 0; k < rightAnswers.length; k++) {
      rightAnswers[k].right_counter = 0;
    }

    //get students answers from student_answers table (id_students, id_questions, answer)
    const studentsAnswers = await getStudentsAnswers();

    //console.log("rightAnswers: ", JSON.stringify(rightAnswers));
    //console.log("studentsAnswers: ", JSON.stringify(studentsAnswers));

    let questionsIdUserHit = [];
    let questionsIdUserMissed = [];
    let usersHits = [];

    let questionsIdUsersHit = [];
    let questionsIdUsersMissed = [];

    for(let i = 0; i < studentsAnswers.length; i++) {
      for(let j = 0; j < rightAnswers.length; j++) {
        if(studentsAnswers[i].id_questions == rightAnswers[j].id) {
          if(studentsAnswers[i].answer == rightAnswers[j].correct_answer) {
            //questionsIdUserHit.push(studentsAnswers[i].id_questions);
            if(!questionsIdUsersHit[studentsAnswers[i].id_students]) {
              questionsIdUsersHit[studentsAnswers[i].id_students] = [];
            }
            questionsIdUsersHit[studentsAnswers[i].id_students].push(studentsAnswers[i].id_questions);
            rightAnswers[j].right_counter++;
          } else {
            //questionsIdUserMissed.push(studentsAnswers[i].id_questions);
            if(!questionsIdUsersMissed[studentsAnswers[i].id_students]) {
              questionsIdUsersMissed[studentsAnswers[i].id_students] = [];
            }
            questionsIdUsersMissed[studentsAnswers[i].id_students].push(studentsAnswers[i].id_questions);
          }
          break;
        }
      }
    }

    //const nonSparseQuestionsIdUsersHit = questionsIdUsersHit.filter(Boolean);
    //const nonSparseQuestionsIdUsersMissed = questionsIdUsersMissed.filter(Boolean);
    
    for(let k = 0; k < questionsIdUsersHit.length; k++) {
    //if(i+1 < studentsAnswers.length) {
      //if(studentsAnswers[i+1].id_students != studentsAnswers[i].id_students) {
      if(questionsIdUsersHit[k]) {
        await setStudentsHitsById(k, questionsIdUsersHit[k], questionsIdUsersMissed[k]);
        console.log(`checkpoint 00024 -> id_students = ${k}`);
        usersHits.push({
          studentId: k,
          questionsIds: questionsIdUsersHit[k],
          statsPoints: await getStatsPoints(questionsIdUsersHit[k])
        })
        setStatsPoints(usersHits[usersHits.length-1].statsPoints, usersHits[usersHits.length-1].studentId);
        questionsIdUserHit = [];
        questionsIdUserMissed = [];
      }
    } 
    
    await setRightAnswersAmount(rightAnswers);
    console.log("checkpoint 00022");
    //set tiebreak
    //usersHits.sort((a, b) => b.questionsIds.length - a.questionsIds.length);

    usersHits.sort((a, b) => {
      // Compare by questionsIds in descending order
      const compareQuestionsIds = b.questionsIds.length - a.questionsIds.length;
    
      // If questionsIds are equal, compare by statsPoints in ascending order
      if (compareQuestionsIds === 0) {
        return a.statsPoints - b.statsPoints;
      }
    
      return compareQuestionsIds;
    });

    console.log("checkpoint 00021: ", usersHits);
    //by here I have the usersHits properly sorted, I have to set the tiebreak_score field on DB in the code below


    let studentsById = []
    for(let k = 0; k < usersHits.length; k++) {
      studentsById.push(usersHits[k].studentId);
    }
    let classification = await getStudentNames(studentsById);

    let classificationString = '';
    for(let k = 0; k < classification.length; k++) {
      classificationString += `${k + 1} - ${classification[k].name}\n`;
    }

    console.log("!!!  CLASSIFICAÇÃO FINAL  !!!");
    console.log(classificationString);


    res.status(200).json({
      message: "message"
    });

  } catch (e) {

    //res.status(400).json({});
    console.log(e.toString());
    res.status(400).json({ message: e.toString() });
  }
}

module.exports.exam_finish_post = async (req, res) => {
  try {
    const userId = req.decodedToken.id;
    console.log("checkpoint 00016: Finish: ", userId);

    const message = await setFinish(userId);

    res.status(200).json({
      message: message
    });

  } catch (e) {

    //res.status(400).json({});
    res.status(400).json({ message: e.toString() });
  }
}

//todo: change post method here and in frontend to patch (or put)
module.exports.exam_post = async (req, res) => {
  try {
    const userId = req.decodedToken.id;
    //console.log("checkpoint 00005: ", JSON.stringify(req.body));

    const studentData = await getExamPageStudentData(userId);
    if (studentData.is_finished) {
      res.status(401).json({message: "is_finished"});
      return;
    }

    const message = await updateExamOptions(userId, req.body);

    res.status(200).json({
      message: message
    });

  } catch (e) {

    //res.status(400).json({});
    res.status(400).json({ message: e.toString() });
  }
}

module.exports.answer_post = async (req, res) => {

}

//todo: use req.decodedToken.type to check if it is a teacher, if it is not -> deny access
//todo: use this type in every get and post request here
module.exports.questions_get = async (req, res) => {
  try {
    //todo: test enter here being a student token on session storage
    if(req.decodedToken.type != "teacher") {
      throw Error('user is not a teacher');
    }
    const userId = req.decodedToken.id;
    const data = await getTeacherQuestionsPageData(userId);
    //console.log(data[0]);
    //console.log(`data length = ${data.length}`);

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
      questionObject.number = k + 1;
      questionObject.media_type = data[k].media_type == null || data[k].media_type == "null" ? "" : data[k].media_type;
      questionObject.media_name = data[k].media_name == null || data[k].media_name == "null" ? "" : data[k].media_name;
      questionObject.media_url = data[k].media_url == null || data[k].media_url == "null" ? "" : data[k].media_url;
      questionObject.media_source = data[k].media_source == null || data[k].media_source == "null" ? "" : data[k].media_source;
      questionsArray.push(questionObject); // Add the question object to the array
    }

    const questionsPageData = {
      teacherName: data[0].name,
      subject: data[0].subject, // considering each teacher has just one subject
      questionsArray: questionsArray,
      userId: userId
    }

    res.status(200).json(questionsPageData);

  } catch (e) {
    console.log(e.toString());
    res.status(400).json({ message: e.toString() });
  }
}


module.exports.exam_get = async (req, res) => {
  try {
    const userId = req.decodedToken.id;

    const studentData = await getExamPageStudentData(userId);
    if (studentData.is_finished) {
      res.status(401).json({message: "is_finished"});
      return;
    }
    const questionsData = await getExamPageQuestionsData(userId);

    const areOptionsCreated = await getStudentOptions(userId, questionsData);
    //console.log("checkpoint 00008: ", areOptionsCreated);
    if (areOptionsCreated == 0) {
      //console.log("checkpoint 00009")
      const createOptions = await createStudentOptions(userId, questionsData);
    }

    const previousMarkedOptions = await getStudentAnswers(userId);
    const previousMarkedOptionsKV = previousMarkedOptions.reduce((acc, item) => {
      acc[item.id_questions] = item.answer;
      return acc;
    }, {});

    console.log(`studentData = ${JSON.stringify(studentData)}`);
    //console.log(`studentData length = ${studentData.length}`);

    //console.log(`questionsData = ${JSON.stringify(questionsData)}`);
    //console.log(`questionsData length = ${questionsData.length}`);

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
      //console.log(`code 00001: `, questionObject.media_type, questionObject.media_name);
      //add what more is needed

      if (questionObject.media_type != "no") {
        //todo: I have to assure that front check media_name length 3 or more
        //before send to api to send to DB
        if (questionObject.media_type == "audio") {
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
        if (!mediaOtherArray.some(media => media.media_type == "no")) {
          mediaOtherArray.push({
            media_name: '',
            media_type: "no"
          });
        }
      }

      questionsArray.push(questionObject);
    }

    //even starts with Audio
    mediaAudioArray = shuffleArray(mediaAudioArray);
    mediaOtherArray = shuffleArray(mediaOtherArray);
    if ((userId % 2) == 0) {
      for (let k = 0; k < mediaAudioArray.length; k++) {
        mediasArray.push(mediaAudioArray[k]);
      }

      for (let k = 0; k < mediaOtherArray.length; k++) {
        mediasArray.push(mediaOtherArray[k]);
      }

      //mediasArray.push(mediaAudioArray);
      //mediasArray.push(mediaOtherArray);
    } else {
      for (let k = 0; k < mediaOtherArray.length; k++) {
        mediasArray.push(mediaOtherArray[k]);
      }

      for (let k = 0; k < mediaAudioArray.length; k++) {
        mediasArray.push(mediaAudioArray[k]);
      }


      //mediasArray.push(mediaOtherArray);
      //mediasArray.push(mediaAudioArray);
    }

    //console.log(`code 00002: mediasArray: `, JSON.stringify(mediasArray));

    questionsArray = shuffleArray(questionsArray);

    //console.log(`code 00003: questionsArray: `, JSON.stringify(questionsArray));

    //let i = 0;

    for (let k = 0; k < mediasArray.length; k++) {

      let isFirstMedia = true;

      for (let i = 0; i < questionsArray.length; i++) {
        if (questionsArray[i].media_name == mediasArray[k].media_name) {
          questionsArray[i].number = orderedQuestionsArray.length + 1;
          questionsArray[i].isFirstMedia = isFirstMedia;
          isFirstMedia = false;
          orderedQuestionsArray.push(questionsArray[i]);
          //console.log(`k = ${k} and i = ${i}`);
          //console.log(`media_name: ${questionsArray[i].media_name}`);
          //console.log(`media_type questionsArray: ${questionsArray[i].media_type}`);
          //console.log(`media_type orderedQuestionsArray: ${JSON.stringify(orderedQuestionsArray)}`);
          questionsArray.splice(i, 1);
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
      userId: userId,
      previousMarkedOptions: previousMarkedOptionsKV
    }

    //console.log(JSON.stringify(questionsPageData));

    res.status(200).json(questionsPageData);

  } catch (e) {
    console.log(e.toString());
    res.status(400).json({ message: e.toString() });
  }
}

module.exports.questions_post = async (req, res) => {
  try {
    const userId = req.decodedToken.id;

    const message = await updateQuestions(userId, req.body);

    res.status(200).json({
      message: message
    });

  } catch (e) {

    //res.status(400).json({});
    res.status(400).json({ message: e.toString() });
  }
}



function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


