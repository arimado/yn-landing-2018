import fs from "fs";
import  { spawn } from "child_process";
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
    fs.mkdir(path.join(__dirname, `temp/${folderName}`), err => {
      if (err) {
        if (err.code && err.code === "EEXIST") {
          console.log(`${folderName} ouput folder already exists`);
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


const splitVideoIntoImages = () => {
  return new Promise((resolve, reject) => {
    console.log("Promise exec: splitVideoIntoImages");
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      path.join(__dirname, "/video/tree.mp4"),
      path.join(__dirname, `temp/rawImageSplit/output_%04d.png`)
    ]);
    ffmpeg.stderr.on('data', (data) => {
      console.log(`${data}`);
    });
    ffmpeg.on('close', (code) => {
      console.log('success!')
      resolve();
    });
  })
}



const deleteFileIn = directoryPath => filePath => new Promise((resolve, reject) => {
  fs.unlink(`${__dirname}/${directoryPath}/${filePath}`, error => {
    if (error) {
      console.log("error: ", error);
      reject();
      return;
    }
    console.log("deleted brah");
    resolve();
  });
})

const clearDirectoryContentsOf = (directoryPath) => {
  return new Promise((resolve, reject) => {
    console.log("clearing directory path of: ", path.join(`${__dirname}/${directoryPath}`));
    fs.readdir(path.join(`${__dirname}/${directoryPath}`), (err, files) => {
      console.log('files: ', files)
      if (err) {
        reject(err);
      }
      const deleteFiles = files.map(deleteFileIn(directoryPath));
      console.log(deleteFiles);
      Promise.all(deleteFiles)
        .then(data => { 
          console.log('dleted!')
          resolve()
        })
        .catch(err => reject());
    });
  }) 
}


const waitFor = time => {
  return new Promise(resolve => {
    console.log("waiting!");
    setTimeout(() => {
      console.log("finished waiting");
      resolve();
    }, time);
  });
}

const init = async (rawImageFolderName) => {
  await createOutputFolder(rawImageFolderName);
  // split source video into images 
    // images go into the output folder 
  await splitVideoIntoImages(rawImageFolderName);
  await waitFor(3000);
  await clearDirectoryContentsOf(`temp/${rawImageFolderName}`); 
  // createEffectOuputFolder() 
  // applyEffectToImages
  // createdRenderOutputFolder
  // mergeImagesIntoVideo
}

init('rawImageSplit');


// splitVideoIntoImages().then(() => {
//   console.log('finished splitting videos ');
// })