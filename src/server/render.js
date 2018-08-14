import fs from "fs";
import path from "path";
import Canvas, { Image } from "canvas";

// From a buffer:
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
