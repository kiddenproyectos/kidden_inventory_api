import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import adminRouter from './routes/admin.js';
import inviteRouter from './routes/invites.js';
import authRouter from './routes/auth.js';

const app = express();

// allow cors
app.use(cors());
// prase json incoming req
app.use(express.json());
// extra security
app.use(helmet());

//routes
app.use('/administration', adminRouter);
app.use('/invitations', inviteRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.json('hola desde el server');
});

export default app;
