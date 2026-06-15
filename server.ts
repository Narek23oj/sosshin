/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { products: [], messages: [], admins: [] };
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function createExpressApp() {
  const app = express();
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // REST API Endpoints
  app.get("/api/db", (req, res) => {
    res.json(getDb());
  });

  app.post("/api/db", (req, res) => {
    const data = req.body;
    saveDb(data);
    res.json({ status: "ok" });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Not found');
        }
      });
    }
  }

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time synchronization
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send initial state
    socket.emit("sync:initial", getDb());

    socket.on("products:update", (products) => {
      const db = getDb();
      db.products = products;
      saveDb(db);
      socket.broadcast.emit("products:changed", products);
    });

    socket.on("messages:update", (messages) => {
      const db = getDb();
      db.messages = messages;
      saveDb(db);
      socket.broadcast.emit("messages:changed", messages);
    });

    socket.on("admins:update", (admins) => {
      const db = getDb();
      db.admins = admins;
      saveDb(db);
      socket.broadcast.emit("admins:changed", admins);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
