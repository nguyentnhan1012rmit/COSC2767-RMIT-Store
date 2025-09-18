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

// runs before test files are evaluated
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test_secret_123'; // any non-empty string
