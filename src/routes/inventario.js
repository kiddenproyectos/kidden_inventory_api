import { Router } from "express";
import AWS from "../aws.js";
import { customAlphabet } from "nanoid";

const inventarioRouter = Router();
const dynamodb = new AWS.DynamoDB();

inventarioRouter.get("/productos", (req, res) => {
  const params = {
    TableName: "Inventario",
  };

  // Realizar el escaneo de la tabla para obtener todos los usuarios
  dynamodb.scan(params, (err, data) => {
    if (err) {
      //   console.error("Error al obtener los productos", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    } else {
      const productos = data.Items; // Los usuarios se encuentran en la propiedad Items del resultado
      //   console.log("productos obtenidos correctamente:", productos);
      return res.status(200).json(productos);
    }
  });
});

inventarioRouter.post("/nuevo-producto", (req, res) => {
  // Obtener los datos enviados desde el cliente (JSON en este caso)
  const { nombre, presentacion, marca, modelo, estado, stock, lugar } =
    req.body;

  // Validar que los datos requeridos estén presentes en la solicitud
  if (!nombre) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  // Generar un ID único para el nuevo usuario
  const alphabet = "0123456789";
  const nanoid = customAlphabet(alphabet, 4);
  const id = nanoid();

  // Crear un objeto con los datos del nuevo usuario
  const producto = {
    // Puedes agregar otros atributos aquí si es necesario
    id: { S: id },
    nombre: { S: nombre },
    presentacion: { S: presentacion },
    marca: { S: marca || "Sin marca" },
    modelo: { S: modelo || "N/A" },
    estado: { S: estado || "No Activo" },
    stock: { S: stock },
    lugar: { S: lugar },
  };

  // Parámetros para la operación de escritura en DynamoDB
  const putParams = {
    TableName: "Inventario", // Reemplaza con el nombre de tu tabla de usuarios
    Item: producto,
    ReturnValues: "ALL_OLD",
  };
  dynamodb.putItem(putParams, (err, data) => {
    if (err) {
      console.error("Error al agregar el producto:", err);
      return res.status(500).json({ error: err });
    } else {
      console.log("Producto agregado correctamente:", data);
      return res.status(201).json({
        message: "Producto agregado correctamente",
        productoNuevo: putParams.Item,
      });
    }
  });
});

export default inventarioRouter;
