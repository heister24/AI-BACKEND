import fs from "fs";

const convertToBase64 = async (image) => {
  const imageBuffer = fs.readFileSync(image);
  const base64Image = imageBuffer.toString("base64");
  return base64Image;
};

export default convertToBase64