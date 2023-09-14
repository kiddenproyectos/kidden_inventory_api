import { Router } from 'express';
import jwt from 'jsonwebtoken';
import AWS from '../aws.js';
import { config } from 'dotenv';
config();

const authRouter = Router();
const dynamodb = new AWS.DynamoDB();
const secretJwt = process.env.SECRET_JWT;

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // asi se hacen consultas por query en dynamos
    // Consultar el índice global secundario por el correo electrónico
    const queryParams = {
      TableName: 'Usuarios',
      IndexName: 'emailIndex', // Cambia esto al nombre de tu índice
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email }, // Asegúrate de que estás pasando el atributo en el formato correcto
      },
    };
    const queryResult = await dynamodb.query(queryParams).promise();
    if (!queryResult.Items) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const storedPassword = queryResult?.Items[0].password.S;

    // Verificar la contraseña (modo manual)

    const didPasswordMatch = password === storedPassword;
    if (!didPasswordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si las credenciales son válidas, generar y enviar el token
    const user = {
      id: queryResult?.Items[0].id.S,
      email: queryResult?.Items[0].email.S,
      invitation: queryResult?.Items[0]?.invitation?.S,
      admin: queryResult?.Items[0]?.admin?.BOOL,
    };

    const token = jwt.sign(user, secretJwt, { expiresIn: '30d' });

    return res.json({ token });
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default authRouter;
