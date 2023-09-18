import { Router } from "express";
import csv from "csv-parser";
import multer from "multer";
import streamifier from "streamifier";
import xlsx from "xlsx";

const planeacionRouter = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

planeacionRouter.post("/archivo", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No se ha proporcionado un archivo" });
  }

  const fileBuffer = req.file.buffer;
  let data = [];

  // Detecta el tipo de archivo según su extensión
  if (req.file.originalname.endsWith(".csv")) {
    // Si es un archivo CSV
    streamifier
      .createReadStream(fileBuffer)
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        res.json(data);
      });
  } else if (
    req.file.originalname.endsWith(".xlsx") ||
    req.file.originalname.endsWith(".xls")
  ) {
    // Si es un archivo XLSX o XLS
    try {
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0]; // Suponemos que solo hay una hoja
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet);

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error al parsear el archivo" });
    }
  } else {
    res.status(400).json({ message: "Tipo de archivo no compatible" });
  }
});

export default planeacionRouter;
