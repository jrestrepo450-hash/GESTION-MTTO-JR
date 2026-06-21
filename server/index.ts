import express, { Request, Response, NextFunction, Express } from "express"; 
import { registerRoutes } from "./routes";
import { setupVite } from "./vite"; 
import http from "http";
import path from "path";

// 🛡️ Creamos nuestra propia función log local para pintar en consola de forma limpia y segura
const log = (message: string) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[vite] ${time} ${message}`);
};

const app: Express = express(); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de registro de peticiones (Logging) - Idéntico al de tu foto original
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const pathReq = req.path;
  let resBody: any = null;

  const resJson = res.json;
  res.json = function (body, ...args) {
    resBody = body;
    return resJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (resBody) {
        logLine += ` :: ${JSON.stringify(resBody)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const httpServer = http.createServer(app);

  // 🛡️ 1. MIDDLEWARE ANTIVIRUS ANTI-CACHÉ (Cura el error 304 de tu foto de red)
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // 2. Registrar las rutas de la API de la Base de Datos
  await registerRoutes(httpServer, app);

  // 3. Manejador de errores completo de Express (Corregido y seguro)
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(status).json({ message });
  });

  // 4. Configuración de producción vs desarrollo con las notas de tu código original
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve("dist/public")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve("dist/public/index.html"));
    });
  } else {
    // 🛡️ Orden de parámetros correcto: primero httpServer (Server), luego app (Express)
    await setupVite(httpServer, app);
  }

  const PORT = Number(process.env.PORT) || 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`Servidor corriendo perfectamente en el puerto ${PORT}`);
  });
})();