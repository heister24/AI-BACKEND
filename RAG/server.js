import express from "express";
import dotenv from "dotenv";
import { chatWithGroq } from "./controllers/rag1.js";
import uploadPDF from "./controllers/pdfParser.js";
dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(express.json());

app.post("/groqChat", chatWithGroq);
app.get("/pdf", uploadPDF);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
