const pool = require('./dbConfig');

async function getStudentNames(studentsById) {
  try {

    const query = `
      SELECT name
      FROM students
      WHERE id IN (${studentsById.join(', ')})
      ORDER BY FIELD(id, ${studentsById.join(', ')})
    `;
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(query);  
    console.log(JSON.stringify(results));

    console.log('checkpoint 00025 -> classification: ', results);

    connection.release();
    //console.log();

    return results;
  } catch (err) {
    console.log('Error querying database: getStudentNames', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function setStatsPoints(statsPoints, studentId) {
  try {
    //console.log("checkpoint");
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(`
      UPDATE students SET tiebreak_score = ?
      WHERE id = ?`,
      [statsPoints, studentId]
    );

    connection.release();
    //console.log(`setStatsPoints with rightAnswers = ${JSON.stringify(rightAnswers)}`);
    return "success";
  } catch (err) {
    console.log('Error querying database: setStatsPoints', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getStatsPoints(questionsIdUserHit) {
  try {
    let statsCounter = 0;
    const connection = await pool.getConnection();
    for (let k = 0; k < questionsIdUserHit.length; k++) {
      const [results, fields] = await connection.query(`
        SELECT right_answers
        FROM questions_stats
        WHERE id_questions = ?`,
        [questionsIdUserHit[k]]
      );
      statsCounter += results[0].right_answers;
      console.log(JSON.stringify(results[0].right_answers));
    }

    console.log('checkpoint 00023 -> statsCounter: ', statsCounter);

    connection.release();
    //console.log();

    return statsCounter;
  } catch (err) {
    console.log('Error querying database: getStatsPoints', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//todo: I have to put a lop inside the function to repeat the query for all the array
//setRightAnswersAmount(rightAnswers) //on question_stats right_answers
//(id, correct_answer, right_counter)
async function setRightAnswersAmount(rightAnswers) {
  try {
    //console.log("checkpoint");
    const connection = await pool.getConnection();

    for (let k = 0; k < rightAnswers.length; k++) {
      const [results, fields] = await connection.query(`
        UPDATE questions_stats SET right_answers = ?
        WHERE id_questions = ?`,
        [rightAnswers[k].right_counter, rightAnswers[k].id]
      );
    }
    
    connection.release();
    console.log(`setRightAnswersAmount with rightAnswers = ${JSON.stringify(rightAnswers)}`);
    return "success";
  } catch (err) {
    console.log('Error querying database: setRightAnswersAmount', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function setStudentsHitsById(studentId, questionsIdUserHit, questionsIdUserMissed) {
  try {
    //console.log("checkpoint");
    const connection = await pool.getConnection();

    for (let k = 0; k < questionsIdUserHit.length; k++) {
      const [results, fields] = await connection.query(`
        UPDATE student_answers SET is_right = TRUE
        WHERE id_students = ? and id_questions = ?`,
        [studentId, questionsIdUserHit[k]]
      );
    }

    for (let k = 0; k < questionsIdUserMissed.length; k++) {
      const [results2, fields2] = await connection.query(`
        UPDATE student_answers SET is_right = FALSE
        WHERE id_students = ? and id_questions = ?`,
        [studentId, questionsIdUserMissed[k]]
      );
    }

    const [results3, fields3] = await connection.query(`
      UPDATE students SET score = ?
      WHERE id = ?`,
      [questionsIdUserHit.length, studentId]
    );
    
    connection.release();
    console.log(`setStudentsHitsById with studentId = ${studentId}\n
      questionsIdUserHit = ${questionsIdUserHit}\n
      questionsIdUserMissed = ${questionsIdUserMissed}\n
      score = ${questionsIdUserHit.length}`
    );
    return "success";
  } catch (err) {
    console.log('Error querying database: setStudentsHitsById', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//get students answers from student_answers table (id_students, id_questions, answer)
async function getStudentsAnswers() {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id_students, id_questions, answer
      FROM student_answers
    `);
    
    connection.release();
    //console.log();
    
    return results;
  } catch (err) {
    console.log('Error querying database: getStudentsAnswers', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }

}

//get rightAnswers from questions table (id, correct_answer)
async function getRightAnswers() {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id, correct_answer
      FROM questions
    `);
    
    connection.release();
    //console.log();
    
    return results;
  } catch (err) {
    console.log('Error querying database: getRightAnswers', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getPeriodCodes() {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT is_enabled
      FROM codes
      WHERE code = 'period1'`);
    
    const [results2, fields2] = await connection.query(`
    SELECT is_enabled
    FROM codes
    WHERE code = 'period2'`);
    
    connection.release();
    console.log(`period1 is: `, results[0].is_enabled);
    console.log(`period2 is: `, results2[0].is_enabled);

    const codes = {
      period1: results[0].is_enabled,
      period2: results2[0].is_enabled
    }
    
    return codes;
  } catch (err) {
    console.log('Error querying database: getPeriodCodes', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function setFinish(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      UPDATE students
      SET is_finished = true
      WHERE id = ?`,
      [studentId]
    );
    console.log(`setFinish with studentId = ${studentId} return: ${JSON.stringify(results)}`);

    connection.release();
    return "success";
  } catch (err) {
    console.log('Error querying database: setFinish', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getExamPageStudentData(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT name, number, classroom, school, is_finished, is_started
      FROM students
      WHERE id = '${studentId}'`);
    connection.release();
    console.log(`getExamPageStudentData(${studentId}) return:`, results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getExamPageStudentData', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getStudentAnswers(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      id_questions, answer
      FROM student_answers
      WHERE id_students = ?`,
      [studentId]
    ); 

    console.log(`getStudentAnswers(${studentId}) return:`, JSON.stringify(results));

    connection.release();
    return results;
  } catch (err) {
    console.log('Error querying database: getStudentAnswers', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getExamPageQuestionsData(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      id, question, correct_answer, wrong_answer_1, wrong_answer_2, 
      wrong_answer_3, wrong_answer_4, media_type, media_name,
      media_url, media_source, media_text
      FROM questions
      WHERE id_teacher = '${2}' OR id_teacher = ${3}`
    ); //todo: remove these teachers harcoded 

    console.log(`getExamPageQuestionsData(${studentId}) return:`, results[0]);

    const [results2, fields2] = await connection.query(`
      UPDATE students
      SET is_started = true
      WHERE id = ?`,
      [studentId]
    );

    connection.release();
    return results;
  } catch (err) {
    console.log('Error querying database: getExamPageQuestionsData', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getTeacherQuestionsPageData(teacherId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      teachers.name, teachers.subject,
      questions.id, questions.question, questions.correct_answer, questions.wrong_answer_1,
      questions.wrong_answer_2, questions.wrong_answer_3, questions.wrong_answer_4,
      questions.media_type, questions.media_name, questions.media_url, questions.media_source
      FROM teachers
      JOIN questions ON teachers.id = questions.id_teacher
      WHERE questions.id_teacher = '${teacherId}'`);
    connection.release();
    console.log('getCredentials() return:', results[0]);
    return results;
  } catch (err) {
    console.log('Error querying database: getCredentials', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getStudentOptions(userId, questionsData) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
    SELECT are_options_created
    FROM students
    WHERE id = '${userId}'`);

    connection.release();
    console.log("checkpoint 00006: ", JSON.stringify(results));
    return results[0].are_options_created;
  } catch (err) {
    console.log('Error querying database: getStudentOptions', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function createStudentOptions(studentId, questions) {
  try {
    console.log("checkpoint 00007: questions.length = ", questions.length);
    const connection = await pool.getConnection();
    for (let k = 0; k < questions.length; k++) {
      const [results, fields] = await connection.query(`
        INSERT INTO student_answers (id_students, id_questions, answer)
        values (?, ?, ?)`,
        [studentId, questions[k].id, '']);
      console.log(`createStudentOptions with studentId = ${studentId} and questions[${k}] = ${JSON.stringify(questions[k])} return: ${JSON.stringify(results)}`);
    }

    const [results, fields] = await connection.query(`
      UPDATE students
      SET are_options_created = ?
      WHERE id = ?`,
      [true, studentId]);

    connection.release();
    return results;
  } catch (err) {
    console.log('Error querying database: createStudentOptions', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//todo: I have to check on frontend if the object has questionsArray.length elements
//if the object has not all elements, ask to select an option for every question
//todo: consider lock to edition some db fields
async function updateExamOptions(studentId, examOptions) {
  try {
    const connection = await pool.getConnection();
    for (let k = 0; k < examOptions.length; k++) {
      const [results, fields] = await connection.query(`
        UPDATE student_answers
        SET answer = ?
        WHERE id_students = ? AND id_questions = ?`,
        [
          examOptions[k].option,
          studentId, examOptions[k].id
        ]);
      console.log(`updateExamOptions with studentId = ${studentId} and examOptions[${k}] = ${JSON.stringify(examOptions[k])} return: ${JSON.stringify(results)}`);
    }

    connection.release();
    return "success";
  } catch (err) {
    console.log('Error querying database: updateExamOptions', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


//todo: when teacher change media info, url will be wrong
//maybe the best is to send these media info to a "moderator"/"manager"
//and this person send media info to the questions table.
//Until I implement this, it will be as it is now.
async function updateQuestions(teacherId, questionsArray) {
  try {
    const connection = await pool.getConnection();
    for (let k = 0; k < questionsArray.length; k++) {
      const [results, fields] = await connection.query(`
        UPDATE questions SET 
        correct_answer = ?, media_name = ?,
        media_source = ?, media_type = ?,
        question = ?, wrong_answer_1 = ?, 
        wrong_answer_2 = ?, wrong_answer_3 = ?, 
        wrong_answer_4 = ? 
        WHERE id_teacher = ? AND id = ?`,
        [
          questionsArray[k].correct_answer, questionsArray[k].media_name,
          questionsArray[k].media_source, questionsArray[k].media_type,
          questionsArray[k].question, questionsArray[k].wrong_answer_1,
          questionsArray[k].wrong_answer_2, questionsArray[k].wrong_answer_3,
          questionsArray[k].wrong_answer_4,
          teacherId, questionsArray[k].id
        ]);
      console.log(`updateQuestions with teacherId = ${teacherId} and questionsArray[${k}] = ${JSON.stringify(questionsArray[k])} return: ${JSON.stringify(results)}`);
    }

    connection.release();
    return "success";
  } catch (err) {
    console.log('Error querying database: updateQuestions', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getTeacherUserData(name) {
  //console.log("checkpoint 2");
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      id, password
      FROM teachers
      WHERE name = '${name}'`);
    connection.release();
    console.log(`getTeacherUserData(${name}) return:`, results[0]);
    return results[0];
  } catch (err) {
    console.log(`Error querying database: getTeacherUserData(${name})`, err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getStudentData(name) {
  //console.log("checkpoint 2");
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      id, name, number, classroom, school, is_started, is_finished
      FROM students
      WHERE LOWER(name) = LOWER('${name}')`);
    connection.release();
    console.log(`getStudentData(${name}) return:`, results[0]);
    return results[0];
  } catch (err) {
    console.log(`Error querying database: getStudentData(${name})`, err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function setStudentData(name, birthdate, numberId, classroom, school, period) {
  try {
    const connection = await pool.getConnection();

    //todo: I am not setting are_options_created to 0, I think I should do it. Check it later.
    const [results, fields] = await connection.query(`
      INSERT INTO students (name, birthdate, number, classroom, school, creation_datetime, period) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [name, birthdate, numberId, classroom, school, period]);
    connection.release();

    console.log(`
    INSERT INTO students (name, birthdate, number, classroom, school, creation_datetime, period) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [name, birthdate, numberId, classroom, school, period]);
    /*
    console.log(`
      INSERT INTO students (name, birthdate, number, classroom, school, creation_datetime, are_options_created) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, FALSE)`,
      [name, birthdate, numberId, classroom, school]);
    */
    console.log('setStudentData() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: setStudentData', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


module.exports = {
  getStudentData,
  getTeacherQuestionsPageData,
  getTeacherUserData,
  updateQuestions,
  setStudentData,
  getExamPageQuestionsData,
  getExamPageStudentData,
  updateExamOptions,
  createStudentOptions,
  getStudentOptions,
  setFinish,
  getPeriodCodes,
  getStudentAnswers,
  getRightAnswers,
  getStudentsAnswers,
  setRightAnswersAmount,
  setStudentsHitsById,
  getStatsPoints,
  setStatsPoints,
  getStudentNames
}