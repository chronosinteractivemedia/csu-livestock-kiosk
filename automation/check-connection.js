const https = require("https");

console.log("Waiting 30 seconds before checking connection...");

setTimeout(() => {
  console.log("Checking connection...");

  https.get("https://csu-tg-cms.onrender.com/upload/files", (response) => {
    if (response.statusCode === 200) {
      console.log("Connection to CMS is intact!");
      process.exit(0);
    } else {
      throw new Error("No connection detected!");
    }
  }).on("error", (err) => {
    console.error("Request failed:", err.message);
    process.exit(1);
  });

}, 30000); // 30 seconds delay