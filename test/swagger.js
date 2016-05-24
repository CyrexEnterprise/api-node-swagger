const path = require('path');
const fs = require('fs');
const swaggerFolder = path.join(__dirname, 'swagger');

const isTest = file => file.substr(-7) === 'test.js';

// change working directory to help dotenv find .env file
process.chdir(swaggerFolder);

fs.readdirSync(swaggerFolder)
  .filter(file => isTest(file))
  .forEach(file => require(path.join(swaggerFolder, file)));
