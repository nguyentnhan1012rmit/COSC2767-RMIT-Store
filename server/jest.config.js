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

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/jest.env.js'], // runs before imports
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '.',
      outputName: 'junit.xml'
    }]
  ]
};
