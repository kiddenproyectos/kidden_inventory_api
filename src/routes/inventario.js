import { Router } from "express";
import AWS from "../aws.js";
import { customAlphabet } from "nanoid";
import multer from "multer";
import sharp from "sharp";

const upload = multer({
  storage: multer.memoryStorage(),
});

const inventarioRouter = Router();
const dynamodb = new AWS.DynamoDB();

inventarioRouter.get("/productos/:month", (req, res) => {
  const { month } = req.params;

  const mesesDelAnio = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };
  const mesNumero = mesesDelAnio[month].toString();

  const params = {
    TableName: "Inventario",
    IndexName: "month-index", // Nombre del GSI
    KeyConditionExpression: `#month = :month`,
    ExpressionAttributeNames: {
      "#month": "month", // Reemplaza "month" con el nombre real del campo de mes
    },
    ExpressionAttributeValues: {
      ":month": { S: mesNumero },
    },
  };

  // Realizar la consulta en el índice global secundario "month-index" utilizando el método query
  dynamodb.query(params, (err, data) => {
    if (err) {
      console.error("Error al obtener los productos", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    } else {
      const productos = data.Items;
      return res.status(200).json(productos);
    }
  });
});

inventarioRouter.post(
  "/nuevo-producto",
  upload.single("imagen"),
  (req, res) => {
    // Obtener los datos enviados desde el cliente (JSON en este caso)
    const {
      nombre,
      presentacion,
      marca,
      modelo,
      estado,
      stock,
      lugar,
      almacen,
      entradas,
      salidas,
    } = req.body;

    // obetener datos del file de la imagen
    const imagen = req.file;

    // Validar que los datos requeridos estén presentes en la solicitud
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Generar un ID único para el nuevo usuario
    const alphabet = "0123456789";
    const nanoid = customAlphabet(alphabet, 4);
    const id = nanoid();

    // Configura S3 para cargar la imagen
    const s3 = new AWS.S3();
    // Nombre del archivo en S3 (puedes ajustarlo según tu estructura)
    const imageKey = `productos/${id}-${nombre}.jpg`;

    if (!imagen) {
      const producto = {
        id: { S: id },
        nombre: { S: nombre },
        presentacion: { S: presentacion },
        marca: { S: marca || "Sin marca" },
        modelo: { S: modelo || "N/A" },
        estado: { S: estado || "No Activo" },
        stock: { S: stock },
        lugar: { S: lugar },
        imagenes: {
          S: "https://kidden-fotos-productos.s3.us-east-1.amazonaws.com/productos/6318-Producto%20de%20Ejemplo.jpg",
        },
        fechaAgregado: { S: new Date().toISOString() }, // Ejemplo de cómo obtener la fecha actual en formato ISO 8601
        month: { S: (new Date().getMonth() + 1).toString() },
        year: { S: new Date().getFullYear().toString() },
        almacen: { S: almacen || "--" },
        entradas: { S: entradas || "--" },
        salidas: { S: salidas || "--" },
      };
      const putParams = {
        TableName: "Inventario",
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
    } else {
      // Lee y comprime la imagen con Sharp antes de cargarla en S3
      // verifica que la iamgen sea menor de 10mb antes de hacer la operacion
      if (imagen.size < 1024 * 1024 * 10) {
        sharp(imagen.buffer)
          .jpeg({ quality: 80 }) // Puedes ajustar la calidad de compresión
          .toBuffer()
          .then((buffer) => {
            const imageParams = {
              Bucket: "kidden-fotos-productos",
              Key: imageKey,
              Body: buffer,
              ContentType: imagen.mimetype,
            };
            // subir a el bucket de S3
            s3.upload(imageParams, (err, data) => {
              if (err) {
                console.error("Error al subir la imagen a S3:", err);
                return res.status(500).json({ error: err });
              } else {
                console.log("Imagen subida a S3:", data.Location);
                // hacer un producto con la location de la imagen
                const producto = {
                  id: { S: id },
                  nombre: { S: nombre },
                  presentacion: { S: presentacion },
                  marca: { S: marca || "Sin marca" },
                  modelo: { S: modelo || "N/A" },
                  estado: { S: estado || "No Activo" },
                  stock: { S: stock },
                  lugar: { S: lugar },
                  // en el caso que sea un array aqui se usaria un SS
                  // imagenes: {
                  //   SS: [data.Location],
                  // },
                  // como yo solo quiero subir una sola imagen uso este caso
                  imagenes: { S: data.Location },
                  fechaAgregado: { S: new Date().toISOString() }, // Ejemplo de cómo obtener la fecha actual en formato ISO 8601
                  month: { S: (new Date().getMonth() + 1).toString() },
                  year: { S: new Date().getFullYear().toString() },
                  almacen: { S: almacen || "--" },
                  entradas: { S: entradas || "--" },
                  salidas: { S: salidas || "--" },
                };

                const putParams = {
                  TableName: "Inventario",
                  Item: producto,
                  ReturnValues: "ALL_OLD",
                };

                // cargar el neuvo producto a la base de datos

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
              }
            });
          })
          .catch((err) => {
            console.error("Error al comprimir la imagen:", err);
            return res.status(500).json({ error: err });
          });
      } else {
        return res.status(400).json({
          error: "La imagen excede el tamaño máximo permitido de 10 MB",
        });
      }
    }
  }
);

// editar items al agregar una nueva entrada
// al agregar una nueva entra se tiene que considerar la existencia actual
inventarioRouter.put("/sumar-entrada/:id", (req, res) => {
  const { id } = req.params;
  const { entradas, almacen } = req.body;

  const updateParams = {
    TableName: "Inventario",
    Key: {
      id: { S: `${id}` }, // Reemplaza "id" con el nombre de la clave primaria
    },
    ExpressionAttributeNames: {
      "#entradas": "entradas",
      "#almacen": "almacen",
    },
    UpdateExpression: "set #entradas = :entradas,#almacen=:almacen",
    ExpressionAttributeValues: {
      ":entradas": { S: `${entradas}` },
      ":almacen": { S: `${Number(entradas) + Number(almacen)}` },
    },
    ReturnValues: "ALL_NEW",
  };
  // modificar la cantidad de entradas al agregar mas
  dynamodb.updateItem(updateParams, (err, data) => {
    if (err) {
      console.error("Error al editar el producto:", err);
      return res.status(500).json({ error: err });
    } else {
      console.log("Producto editado correctamente:", data);
      return res.status(201).json({
        message: "Producto Editado correctamente",
        productoEditado: data,
      });
    }
  });
});
inventarioRouter.put("/restar-salida/:id", (req, res) => {
  const { id } = req.params;
  const { salidas, almacen } = req.body;

  if (Number(salidas) > Number(almacen)) {
    return res.status(500).json({
      error:
        "cuidado tu numero de salidas es mayor que tu existencia, verifica los datos",
    });
  }

  const updateParams = {
    TableName: "Inventario",
    Key: {
      id: { S: `${id}` }, // Reemplaza "id" con el nombre de la clave primaria
    },
    ExpressionAttributeNames: {
      "#salidas": "salidas",
      "#almacen": "almacen",
    },
    UpdateExpression: "set #salidas = :salidas,#almacen=:almacen",
    ExpressionAttributeValues: {
      ":salidas": { S: `${salidas}` },
      ":almacen": { S: `${Number(almacen) - Number(salidas)}` },
    },
    ReturnValues: "ALL_NEW",
  };
  // modificar la cantidad de entradas al agregar mas
  dynamodb.updateItem(updateParams, (err, data) => {
    if (err) {
      console.error("Error al editar el producto:", err);
      return res.status(500).json({ error: err });
    } else {
      console.log("Producto editado correctamente:", data);
      return res.status(201).json({
        message: "Producto Editado correctamente",
        productoEditado: data,
      });
    }
  });
});
// Función para borrar un elemento por su clave primaria
async function deleteItemById(id) {
  const deleteParams = {
    TableName: "Inventario",
    Key: {
      id: { S: `${id}` }, // Reemplaza "id" con el nombre de la clave primaria
    },
  };
  return dynamodb.deleteItem(deleteParams).promise();
}

// Endpoint para eliminar productos por IDs
inventarioRouter.post("/eliminar-productos", async (req, res) => {
  // Obtener los IDs de los productos a eliminar desde el cuerpo de la solicitud
  const { ids } = req.body;

  // Validar que se proporcionaron IDs válidos
  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ error: "Se requiere un array de IDs válidos" });
  }

  try {
    // Iterar sobre los IDs y realizar las operaciones de eliminación
    const deletedProducts = [];
    const errors = [];

    for (const id of ids) {
      try {
        await deleteItemById(id);
        deletedProducts.push(id);
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    if (errors.length === 0) {
      return res.json({
        message: "Productos eliminados con éxito",
        deletedProducts,
      });
    } else {
      return res.status(500).json({
        error: "Error al eliminar algunos productos",
        deletedProducts,
        errors,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default inventarioRouter;
