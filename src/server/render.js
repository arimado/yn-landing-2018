import fs from "fs";
import path, { dirname } from "path";
import Canvas, { Image } from "canvas";

// From a buffer:

const readSingleImage = () => {
  fs.readFile(path.join(__dirname, "/images/img.jpg"), (err, src) => {
    if (err) throw err;
    const img = new Image();
    img.onerror = err => {
      throw err;
    };
    img.onload = () => {
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      console.log("write file");
      const buf = canvas.toBuffer();
      fs.writeFileSync("canvas2.png", buf);
    };
    img.src = src;
  });
}

const createOutputFolder = (folderName) => {
  console.log('createOutputFoldser()');
  return new Promise((resolve, reject) => {
    fs.mkdir(path.join(__dirname, `../images/${folderName}`), err => {
      if (err) {
        if (err.code && err.code === "EEXIST") {
          console.log("ouput folder already exists");
          resolve();
          return;
        }
        reject(err);
        return;
      }
      resolve();
    });    
  });
}


// const splitVideoIntoImages = () => {
//   return new Promise((resolve, reject) => {
//     const ffmpeg = spawn("ffmpeg", [
//       "-i",
//       path.join(__dirname, "./video/tree.mp4"),
//       path.join(__dirname, "./video")
//     ]);
//     ffmpeg.stderr.on('data', (data) => {
//       console.log(`${data}`);
//     });
//     ffmpeg.on('close', (code) => {
//       resolve();
//     });
//   })
// }

(async () => {
  const createFolder = await createOutputFolder('imageOutput');
})()



// splitVideoIntoImages().then(() => {
//   console.log('finished splitting videos ');
// })