import fs from "fs";
import path from "path";
import Canvas, { Image } from "canvas";

const canvas = new Canvas(200, 200);
const ctx = canvas.getContext('2d');

// From a buffer:
fs.readFile(path.join(__dirname, "/images/img.jpg"), (err, src) => {
  if (err) throw err;
  const img = new Image();
  console.log(ctx);
  console.log(Object.keys(ctx))
  img.onload = () => ctx.drawImage(img, 0, 0);
  img.onerror = err => {
    throw err;
  };
  img.src = src;

  const buf = canvas.toBuffer();
  fs.writeFileSync("canvas.png", buf);
});
