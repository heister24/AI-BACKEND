import fs from "fs";
import { PDFParse } from "pdf-parse";

const uploadPDF = async (req, res) => {
  const pdfPath = "./grocery.pdf";
  const pdfBuffer = fs.readFileSync(pdfPath);
  const ParsedResult = new PDFParse({ data: pdfBuffer });
  // getText()
  //   const result = await ParsedResult.getText()
  //result.pages - gives all pages info
  //result.text - gives complete text

  // getInfo() - metadata related to document
  const result = await ParsedResult.getText();
  const text = result.text;
  return res.status(200).json(text);
};

export default uploadPDF;
