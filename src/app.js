import express from "express";
import helmet from "helmet";
import cors from "cors";
import adminRouter from "./routes/admin.js";
import planeacionRouter from "./routes/planeacion.js";
import authRouter from "./routes/auth.js";
import inventarioRouter from "./routes/inventario.js";

const app = express();

// allow cors
app.use(cors());
// prase json incoming req
app.use(express.json());
// extra security
app.use(helmet());

//routes
app.use("/administration", adminRouter);
app.use("/planeacion", planeacionRouter);
app.use("/auth", authRouter);
app.use("/inventario", inventarioRouter);

app.get("/", (req, res) => {
  res.json("hola desde el server");
});

export default app;
