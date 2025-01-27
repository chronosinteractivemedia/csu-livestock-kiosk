const http = require("https");

console.log('Checking connection...');
http.get(`https://csu-tg-cms.onrender.com/upload/files`, (response) => {
  if (response.statusCode === 200) {
    console.log('Connection to CMS is intact!')
    process.exit(0);
  } else {
    throw new Error('No connection detected!');
  }
});
