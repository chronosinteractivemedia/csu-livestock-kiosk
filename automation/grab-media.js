const http = require("https");
const fs = require("fs");
const axios = require("axios");

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest, { flags: "wx" });

        const request = http.get(url, response => {
            if (response.statusCode === 200) {
                response.pipe(file);
            } else {
                file.close();
                fs.unlink(dest, () => {}); // Delete temp file
                reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
            }
        });

        request.on("error", err => {
            file.close();
            fs.unlink(dest, () => {}); // Delete temp file
            reject(err.message);
        });

        file.on("finish", () => {
            resolve();
        });

        file.on("error", err => {
            file.close();

            if (err.code === "EEXIST") {
                reject("File already exists");
            } else {
                fs.unlink(dest, () => {}); // Delete temp file
                reject(err.message);
            }
        });
    });
}

(async () => {
    let images = await axios.get('https://csu-livestock-award-kiosk-cms.onrender.com/api/upload/files?limit=1000');
    images = images.data;
    let i = 1;
    for(let image of images){
        console.log(`Downloading media ${i++} of ${images.length}`);
        try{
            await download(`https://csu-tg-cms.onrender.com${image.url}`, `renderer/public${image.url}`);
        } catch (e) {
            console.log(e);
        }
        console.log('Success!');
    }
})();