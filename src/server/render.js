import fs from "fs";
import  { spawn } from "child_process";
import path from "path";
import Canvas, { Image } from "canvas";

const FPS = 60;
const DPF = 512; // dots per frame


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
      console.log('successfully split images into video!')
      resolve();
    });
  })
}

const mergeImagesIntoVideo = () => new Promise((resolve, reject) => {
  const ffmpeg = spawn("ffmpeg", [
    "-i",
    path.join(__dirname, `temp/effectsImageSplit/output_%04d.png`),
    "-pix_fmt",
    "yuv420p",
    path.join(__dirname, "/render/output_final.mp4")
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
  const directory = path.join(`${__dirname}/${directoryPath}`); 
  console.log('directory path for files: ', directory); 
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.log('cannot read directory');
      reject(err);
    } 
    const filteredFiles = files.filter(file => file !== '.DS_Store');
    const deleteFiles = filteredFiles
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


// applyImageEffect 

// toImage add event listeners to img 
// setup() create canvas for render and another one to get image data
// --> get renderCanvas and imageData 
// halftone() generateHalftoneData 
// --> return halftoneData & renderCanvas
// render() 
// --> 

const toImage = () => {
  return src => {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = e => resolve(image)
      image.onerror = e => reject(e)
      image.src = src;
    });
  }
}



const setupCanvas = () => {
  return (img) => {
    const renderCanvas = new Canvas(img.width, img.height);
    const onContext = renderCanvas.getContext("2d");
    onContext.fillStyle = "white";
    onContext.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    onContext.fillStyle = "black";  
    
    const imageCanvas = new Canvas(renderCanvas.width, renderCanvas.height);
    const imageCanvasContext = imageCanvas.getContext("2d");
    imageCanvasContext.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
    const imageData = imageCanvasContext.getImageData(0, 0, imageCanvas.width, imageCanvas.height);

    return { renderCanvas, imageData };
  }
}


const drawPixel = ({ ctx, cx, cy, s, kernel }) => {
  const base = kernel * 2;
  const fontsize = base * (1 - s);
  const ch = String.fromCodePoint(34 + Math.random() * 30 | 0);
  ctx.font = `${fontsize}px monospace`;
  ctx.fillText(ch, cx - (fontsize * 0.8) / 2, cy + fontsize / 2);
}

const halftone = ({ kernel = 10 }) => { // support subregion maybe good (?)

  const grayscale = ({ r, g, b }) => { // in 0..255
    return 0.2 * r / 255 + 0.7 * g / 255 + 0.1 * b / 255; // in 0..1
  }

  const samplize = ({ x, y, imageData }) => { // x, y = top left corner of kernel
    const { width, height, data } = imageData;
    const samples = [];
    for (let i = y; i < y + kernel; i++) {
      for (let j = x; j < x + kernel; j++) {
        const at = (i * width + j) * 4;
        const r = data[at];
        const g = data[at + 1];
        const b = data[at + 2];
        samples.push({ r, g, b });
      }
    }
    let sum = 0;
    for (const sample of samples)
      sum += grayscale(sample);
    return sum / samples.length; // avg
  }

  return ({ renderCanvas, imageData }) => {

    const halftoneData = { // struct is inspired by ImageData{}
      kernel: kernel, // kernel size, n x n 
      width: imageData.width / kernel | 0, // in dot
      height: imageData.height / kernel | 0, // in dot
      data: [] // array of num (normalized)
    };

    for (let y = 0; y <= imageData.height - kernel; y += kernel) {
      for (let x = 0; x <= imageData.width - kernel; x += kernel) {
        halftoneData.data.push(samplize({ x, y, imageData }));
      }
    }

    return { halftoneData, renderCanvas };
  };
}

const renderEffect = ({ dotsPerFrame = 1, fps = 10 }, imagePath) => {
  return ({ halftoneData, renderCanvas }) => {
    return new Promise((resolve, reject) => {
    console.log('applied effect to: ', imagePath);
      const ctx = renderCanvas.getContext("2d");
      const { width, height, kernel, data } = halftoneData;
      const dotsCount = width * height;
      let dotsDrawn = 0;
      (function tick() {
        for (let i = 0; i < dotsPerFrame && dotsDrawn < dotsCount; i++) {
          const cx = (dotsDrawn % width) * kernel + kernel / 2;
          const cy = ((dotsDrawn / width) | 0) * kernel + kernel / 2;
          const s = data[dotsDrawn];
          drawPixel({ ctx, cx, cy, s, kernel });
          dotsDrawn += 1;
        }

        if (dotsDrawn < dotsCount) setTimeout(tick, 1000 / fps);
        else { 
          console.log('rendering effect for: ', imagePath);
          resolve({ renderCanvas }) 
        };
      })();
    });
  };
};

const fx = (imgSrc, imagePath) => {
  return Promise.resolve(imgSrc)
    .then(toImage())
    .then(setupCanvas())
    .then(halftone({ kernel: 10 }))
    .then(renderEffect({ dotsPerFrame: DPF, fps: FPS }, imagePath));
}


const applyImageEffect = targetDirectory => imagePath => new Promise((resolve, reject) => {
  fs.readFile(imagePath, (err, src) => {
    if (err) reject(); 
    fx(src, imagePath)
      .then(({ renderCanvas }) => {
        const data = renderCanvas.toBuffer();
        fs.writeFile(
          path.join(
            __dirname,
            targetDirectory,
            path.basename(imagePath)
          ),
          data,
          err => {
            if (err) {
              reject();
              return;
            }            
            resolve();
          }
        );
      })
      .catch(err => {
        console.error('something went wrong: ', err); 
      })
  });
});

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
  const renderFolder = `/render`;
  const updateTempImages = updateFilesInDirectory(rawFolder, 'updateTempImages');
  const updateEffectImages = updateFilesInDirectory(effectFolder, 'updateEffectImages');
  const updateRenders = updateFilesInDirectory(renderFolder, 'updateRenders');

  await createOutputFolder(rawImageFolderName);
  // split source video into images 
    // images go into the output folder 
  await splitVideoIntoImages(rawImageFolderName);
  console.log('creating ouput folder....')
  await createOutputFolder(effectsFolderName);
  console.log('applying effects to images ....')
  await updateTempImages(applyImageEffect(effectFolder));
  console.log('deleting temp images ....')
  await updateTempImages(deleteFile);
  console.log('deleting renders ....')
  await updateRenders(deleteFile);
  console.log('merging images into video ....')
  await mergeImagesIntoVideo(effectsFolderName);
  console.log('deleting styled images')
  await updateEffectImages(deleteFile); 
  // createEffectOuputFolder();
  // applyEffectToImages
  // createdRenderOutputFolder
  // mergeImagesIntoVideo
  console.log('application has finished running')
}

console.log('render')
init('rawImageSplit', 'effectsImageSplit');


// splitVideoIntoImages().then(() => {
//   console.log('finished splitting videos ');
// })