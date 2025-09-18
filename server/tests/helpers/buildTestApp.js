/*
RMIT University Vietnam
Course: COSC2767|COSC2805 Systems Deployment and Operations
Semester: 2025B
Assessment: Assignment 2
Author: Bui Viet Anh
ID: s3988393
Created  date: 14/09/2025
Last modified: 18/09/2025
Acknowledgement: None
*/

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const apiRoutes = require('../../routes/api'); // mounts /auth, /product, etc.

module.exports = function buildTestApp() {
  const app = express();
  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use('/api', apiRoutes); // BASE_API_URL is 'api' per .env.example
  return app;
};
