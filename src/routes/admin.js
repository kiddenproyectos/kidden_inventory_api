import { Router } from "express";
import { customAlphabet } from "nanoid";
import generator from "generate-password";
import AWS from "../aws.js";

const adminRouter = Router();

const dynamodb = new AWS.DynamoDB();

adminRouter.get("/users", (req, res) => {
  const params = {
    TableName: "Usuarios", // Reemplaza con el nombre de tu tabla de usuarios
  };

  // Realizar el escaneo de la tabla para obtener todos los usuarios
  dynamodb.scan(params, (err, data) => {
    if (err) {
      console.error("Error al obtener los usuarios:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    } else {
      const usuarios = data.Items; // Los usuarios se encuentran en la propiedad Items del resultado
      console.log("Usuarios obtenidos correctamente:", usuarios);
      return res.status(200).json(usuarios);
    }
  });
});

adminRouter.post("/user", (req, res) => {
  // Obtener los datos enviados desde el cliente (JSON en este caso)
  const { nombre, rol, password } = req.body;

  // Validar que los datos requeridos estén presentes en la solicitud
  if (!nombre || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Generar un ID único para el nuevo usuario
  const alphabet = "0123456789";
  const nanoid = customAlphabet(alphabet, 4);
  const id = nanoid();

  // Crear un objeto con los datos del nuevo usuario
  const usuario = {
    id: { S: id },
    nombre: { S: nombre },
    rol: { S: rol },
    password: { S: password },
    // Puedes agregar otros atributos aquí si es necesario
  };

  // Parámetros para la operación de escritura en DynamoDB
  const putParams = {
    TableName: "Usuarios", // Reemplaza con el nombre de tu tabla de usuarios
    Item: usuario,
    ReturnValues: "ALL_OLD",
  };

  // Realizar la operación de escritura en DynamoDB para agregar el nuevo usuario
  dynamodb.putItem(putParams, (err, data) => {
    if (err) {
      console.error("Error al agregar el usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    } else {
      console.log("Usuario agregado correctamente:", data);
      return res
        .status(201)
        .json({ message: "Usuario agregado correctamente" });
    }
  });
});

adminRouter.get("/user/password", (req, res) => {
  const password = generator.generate({
    length: 10,
    numbers: true,
  });
  return res.status(200).json(password);
});
export default adminRouter;
