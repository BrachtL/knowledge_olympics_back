const pool = require('./dbConfig');

async function getExamPageStudentData(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT name, number, classroom, school
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


async function getExamPageQuestionsData(studentId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      id, question, correct_answer, wrong_answer_1, wrong_answer_2, 
      wrong_answer_3, wrong_answer_4, media_type, media_name,
      media_url, media_source, media_text
      FROM questions
      WHERE id_teacher = '${2}' OR id_teacher = ${3}`); //todo: remove this ehre cluase from here?
    connection.release();
    console.log(`getExamPageQuestionsData(${studentId}) return:`, results[0]);
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
    const[results, fields] = await connection.query(`
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
    for(let k = 0; k < questions.length; k++) {
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
    for(let k = 0; k < examOptions.length; k++) {
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
    for(let k = 0; k < questionsArray.length; k++) {
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
          questionsArray[k].wrong_answer_2, questionsArray[k].wrong_answer_3 ,
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
      id, name, number, classroom, school
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

async function setStudentData(name, birthdate, numberId, classroom, school) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(`
      INSERT INTO students (name, birthdate, number, classroom, school, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, birthdate, numberId, classroom, school]);
    connection.release();

    console.log(`
      INSERT INTO students (name, birthdate, number, classroom, school, creation_datetime, are_options_created) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, FALSE)`,
      [name, birthdate, numberId, classroom, school]); 
    console.log('setStudentData() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: setStudentData', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}




async function insertUser(
  email, hashedPassword, name, age, category, description, locationId,
  imageUrl
  ) {
  try {
    const connection = await pool.getConnection();
    //const [results, fields] = await connection.query(`
    //  INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
    //  VALUES ('${locationId}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${imageUrl}', '${category}')`);
    //console.log(`INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
    //VALUES ('${locationId}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${imageUrl}', '${category}')`);
   
    //todo: insert current_timestamp (or "Now()") in creation_datetime
    const [results, fields] = await connection.query(`
      INSERT INTO users (id_location, email, name, age, password, description, image_url, category, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [locationId, email, name, age, hashedPassword, description, imageUrl, category]);    
    connection.release();

    console.log(`
      INSERT INTO users (id_location, email, name, age, password, description, image_url, category, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [locationId, email, name, age, hashedPassword, description, imageUrl, category]);
    console.log('insertUser() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: insertUser', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function insertLocation(latitude, longitude, uf, city) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      INSERT INTO locations (latitude, longitude, uf, city) VALUES (?, ?, ?, ?)`,
      [latitude, longitude, uf, city]);
    console.log('insertLocation() return:', results);
    connection.release();
    return results.insertId;
    
  } catch (err) {
    console.log('Error querying database: insertLocation', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getLocationId(city, uf) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id FROM locations WHERE city = '${city}' AND uf = '${uf}'`);
    console.log('getLocationId() return:', results);
    connection.release();
    if (results.length > 0) {
      console.log(results[0].id);
      return results[0].id;
    } else {
      return 0;
    }
    
  } catch (err) {
    console.log('Error querying database: getLocationId', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//this query is only used to give the user a token. All the rest (getUser(id)) is done with the token
async function getUserData(email) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      users.id, users.email, users.password,
      locations.latitude, locations.longitude
      FROM users
      JOIN locations ON users.id_location = locations.id
      WHERE email = '${email}'`);
    connection.release();
    console.log('getCredentials() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getCredentials', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getUser(id) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id, id_location, email, name, age, password, description, image_url, category
      FROM users WHERE id = '${id}'`);
    connection.release();
    console.log('getUser() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getUser', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function getPetsExceptMineLikedDisliked(userId) {
  try {
    const connection = await pool.getConnection();
/*
    const [results, fields] = await connection.query(`
      SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
      pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
      locations.country, locations.uf, locations.city, locations.latitude, locations.longitude
      FROM pets
      JOIN locations ON pets.id_location = locations.id
      WHERE pets.id_user != ?`, [userId]);
*/

    const [results, fields] = await connection.query(`SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
      pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
      locations.country, locations.uf, locations.city, locations.latitude, locations.longitude
      FROM pets
      JOIN locations ON pets.id_location = locations.id
      WHERE pets.id_user != ? 
      AND pets.id NOT IN (
        SELECT id_pet_liked
        FROM user_liked_interactions
        WHERE id_user = ?
      )
      AND pets.id NOT IN (
        SELECT id_pet_disliked
        FROM user_disliked_interactions
        WHERE id_user = ?
      );`, [userId, userId, userId]);


    connection.release();
    console.log(`getPetsExceptMineLikedDisliked(${userId}) return: ${JSON.stringify(results)}`);
    return results;
  } catch (err) {
    console.log('Error querying database: getPetsExceptMineLikedDisliked', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

  async function setLikeRelation(userId, petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        INSERT INTO user_liked_interactions (id_user, id_pet_liked) VALUES (?, ?)`,
        [userId, petId]);
      connection.release();
      console.log(`setLikeRelation(${userId}, ${petId}) return: ${JSON.stringify(results)}`);
      return results.insertId;
    } catch (err) {
      console.log('Error querying database: setLikeRelation', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  async function setDislikeRelation(userId, petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        INSERT INTO user_disliked_interactions (id_user, id_pet_disliked) VALUES (?, ?)`,
        [userId, petId]);
      connection.release();
      console.log(`setDislikeRelation(${userId}, ${petId}) return: ${JSON.stringify(results)}`);
      return results.insertId;
    } catch (err) {
      console.log('Error querying database: setDislikeRelation', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  async function getSecondaryImagesURL(petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        SELECT url FROM secondary_images_url WHERE id_pet = ?`,
        [petId]);
      connection.release();
      console.log(`getSecondaryImagesURL(${petId}) return: ${JSON.stringify(results)}`);
      
      let urlList = [];
      results.forEach( element => {
        urlList.push(element.url);
      })
      
      console.log(`urlList: ${urlList}`);
      
      return urlList;
    } catch (err) {
      console.log('Error querying database: getSecondaryImagesURL', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  //CHECK THIS QUERY!
  async function getLikedPets(userId) {
    try {
      const connection = await pool.getConnection();
  
      const [results, fields] = await connection.query(`SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
        pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
        locations.country, locations.uf, locations.city, locations.latitude, locations.longitude
        FROM pets
        JOIN locations ON pets.id_location = locations.id
        JOIN user_liked_interactions ON pets.id = user_liked_interactions.id_pet_liked
        WHERE user_liked_interactions.id_user = ?;`, [userId]);
  
  
      connection.release();
      console.log(`getLikedPets(${userId}) return: ${JSON.stringify(results)}`);
      return results;
    } catch (err) {
      console.log('Error querying database: getLikedPets', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }


module.exports = {
  insertUser,
  getUserData,
  getLocationId,
  insertLocation,
  getPetsExceptMineLikedDisliked,
  setLikeRelation,
  setDislikeRelation,
  getSecondaryImagesURL,
  getLikedPets,
  
  getStudentData,
  getTeacherQuestionsPageData,
  getTeacherUserData,
  updateQuestions,
  setStudentData,
  getExamPageQuestionsData,
  getExamPageStudentData,
  updateExamOptions,
  createStudentOptions,
  getStudentOptions
}