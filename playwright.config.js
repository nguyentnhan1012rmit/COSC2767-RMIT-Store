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

// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    headless: true,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
