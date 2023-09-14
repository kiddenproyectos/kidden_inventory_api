import { Router } from "express";
import fetch from "node-fetch";
import csv from "csv-parser";
import multer from "multer";
import streamifier from "streamifier";

const inviteRouter = Router();

inviteRouter.get("/", async (req, res) => {
  // peticion desde wordpress
  const response = await fetch("https://invitamemx.com/wp-json/wp/v2/pages");
  const data = await response.json();

  // devolver lo que necesito
  return res.status(200).json(
    data.map((page) => ({
      link: page.link,
      nombre: page.title.rendered,
    }))
  );
});

inviteRouter.get("/:name", async (req, res) => {
  const { name } = req.params;
  // peticion desde wordpress
  // end point personalizado con plugin
  const response = await fetch(
    `https://invitamemx.com/wp-json/wp/v2/forms/submissions/${name}`
  );
  const data = await response.json();
  // devolver lo que necesito
  return res.status(200).json(
    data.map((invitado) => ({
      id: invitado?.id,
      link: invitado?.referer,
      inviteName: invitado?.referer_title,
      nombreInvitado: invitado.form_values?.name,
      parentesco: invitado.form_values?.field_9a97d10,
      acompañante: invitado.form_values?.field_e6ea7a9,
      alergias: invitado.form_values?.message,
      asistencia: invitado.form_values?.field_a440fe3,
      telefono: invitado.form_values?.email,
    }))
  );
});

// Almacena el archivo en memoria ram para que se acceda
// de otra forma tendrias que subir el archivo a un server o espacio y pasar la ruta
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// mandas el archivo
inviteRouter.post("/guests", upload.single("csvFile"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No se ha proporcionado un archivo CSV" });
  }

  const csvData = [];
  // usas el buffer que es el contenido de el archivo en si mismo
  streamifier
    .createReadStream(req.file.buffer) // Lee el contenido del archivo en memoria
    .pipe(csv())
    .on("data", (row) => {
      csvData.push(row);
    })
    .on("end", () => {
      res.json(csvData); // Devuelve los datos parseados al cliente
    });
});

export default inviteRouter;
