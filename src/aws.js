import AWS from 'aws-sdk';
import { config } from 'dotenv';
config();

AWS.config.update({
  region: 'us-east-1', // Reemplaza con la región de tu elección
  accessKeyId: process.env.ACCESS,
  secretAccessKey: process.env.ACCESS_SECRET,
});

export default AWS;

// crear tabla, no se como crearla desde la consola xd
// const dynamodb = new AWS.DynamoDB();

// const params = {
//   TableName: 'Users',
//   KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }], // Clave primaria 'id'
//   AttributeDefinitions: [
//     { AttributeName: 'id', AttributeType: 'S' }, // Atributo 'id'
//     { AttributeName: 'email', AttributeType: 'S' }, // Atributo 'email'
//   ],
//   ProvisionedThroughput: {
//     ReadCapacityUnits: 5, // Unidades de capacidad de lectura por segundo
//     WriteCapacityUnits: 5, // Unidades de capacidad de escritura por segundo
//   },
//   GlobalSecondaryIndexes: [
//     {
//       IndexName: 'emailIndex', // Nombre del índice global secundario
//       KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
//       Projection: {
//         ProjectionType: 'ALL', // Proyectar todos los atributos en el índice
//       },
//       ProvisionedThroughput: {
//         ReadCapacityUnits: 5, // Unidades de capacidad de lectura por segundo
//         WriteCapacityUnits: 5, // Unidades de capacidad de escritura por segundo
//       },
//     },
//   ],
// };

// dynamodb.createTable(params, function (err, data) {
//   if (err) {
//     console.error('Error al crear la tabla:', err);
//   } else {
//     console.log('Tabla creada correctamente:', data);
//   }
// });
