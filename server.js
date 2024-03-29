const express = require("express");
const app = express();

// Allow all origins (for development purposes)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Replace '*' with your frontend domain
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');
  next();
});

app.use((req, res, next) => {
  // Set cache-control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

require('dotenv').config()

//middleware (ponte entre requests)
app.use(express.json());

const routes = require('./routes/routes').router
app.use(routes);

const teste = require('./routes/routes').teste;
console.log("teste -> " + teste);

// Function to handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Function to handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});



//check if server is online
app.route("/").get((requirement, response) => {
  response.send("The server is online");
  console.log("The server is online");
});

app.listen(3001);
console.log("successful loaded :D");




/*
  db table -> test_user
  db fields -> id (AI, PK), email (UNIQUE), password (char(60))
  next steps:
  - create the signup and sign in, with hash and jwt
  - test with insomnia
  
  - model db, user data
  - begin app dev
  - backend dev
  - test
*/