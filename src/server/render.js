import fs from "fs";
import  { spawn } from "child_process";
import path, { dirname } from "path";
import Canvas, { Image } from "canvas";

const createOutputFolder = (folderName) => {
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

// /Users/jeremyarimado/projects/yn-landing-2018/src/server/temp/effectImageSplit/output_%04d.png
// /Users/jeremyarimado/projects/yn-landing-2018/src/server/temp/effectsImageSplit/
// `ffmpeg -framerate 24 -i output_%04d.png -pix_fmt yuv420p output2.mp4

const mergeImagesIntoVideo = () => new Promise((resolve, reject) => {
  const ffmpeg = spawn("ffmpeg", [
    "-i",
    path.join(__dirname, `temp/effectsImageSplit/output_%04d.png`),
    '-pix_fmt',
    'yuv420p',
    path.join(__dirname, "/video/output_final.mp4"),
  ]);
  ffmpeg.stderr.on('data', (data) => {
    console.log(`${data}`);
  });
  ffmpeg.on('close', (code) => {
    console.log('merge applied!')
    resolve();
  });
});

const updateFilesInDirectory = directoryPath => updateFile => new Promise((resolve, reject) => {
  fs.readdir(path.join(`${__dirname}/${directoryPath}`), (err, files) => {
    if (err) {
      reject(err);
    }
    const deleteFiles = files
      .map(fileName => `${__dirname}/${directoryPath}/${fileName}`)
      .map(updateFile);
    Promise.all(deleteFiles)
      .then(data => resolve())
      .catch(err => reject());
  });
}); 

const deleteFile = filePath => new Promise((resolve, reject) => {
  fs.unlink(filePath, error => {
    if (error) {
      reject();
    }
    resolve();
  });
})

const applyImageEffect = targetDirectory => imagePath => new Promise((resolve, reject) => {
  fs.readFile(imagePath, (err, src) => {
    if (err) reject();
    const img = new Image();
    img.onerror = err => {
      throw err;
    };
    img.onload = () => {
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      ctx.beginPath();
      ctx.lineWidth = "10";
      ctx.strokeStyle = "blue";
      ctx.rect(50, 50, 150, 80);
      ctx.stroke();
      const data = canvas.toBuffer();
      fs.writeFile(
        path.join(__dirname, targetDirectory, path.basename(imagePath)),
        data,
        err => {
          if (err) {
            reject();
            return;
          }
          resolve();
        }
      );
    };
    img.src = src;
  });
});

const clearDirectoryContentsOf = (directoryPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path.join(`${__dirname}/${directoryPath}`), (err, files) => {
      if (err) {
        reject(err);
      }
      const deleteFiles = files
        .map(fileName => `${__dirname}/${directoryPath}/${fileName}`)
        .map(deleteFile);
      Promise.all(deleteFiles)
        .then(data => resolve())
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



const init = async (rawImageFolderName, effectsFolderName) => {
  const rawFolder = `temp/${rawImageFolderName}`;
  const effectFolder = `temp/${effectsFolderName}`;
  const updateTempImages = updateFilesInDirectory(rawFolder);
  const updateEffectImages = updateFilesInDirectory(effectFolder);

  await createOutputFolder(rawImageFolderName);
  // split source video into images 
    // images go into the output folder 
  await splitVideoIntoImages(rawImageFolderName);
  await createOutputFolder(effectsFolderName);
  await updateTempImages(applyImageEffect(effectFolder));
  await waitFor(3000); 
  await updateTempImages(deleteFile); 
  await mergeImagesIntoVideo(effectsFolderName);
  await updateEffectImages(deleteFile);
  // createEffectOuputFolder();
  // applyEffectToImages
  // createdRenderOutputFolder
  // mergeImagesIntoVideo
  console.log('done')
}

init('rawImageSplit', 'effectsImageSplit');


// splitVideoIntoImages().then(() => {
//   console.log('finished splitting videos ');
// })