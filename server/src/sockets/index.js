import { Server } from "socket.io";
import { env } from "../config/env.js";
import { getUserFromToken } from "../services/auth.js";
import { objectId } from "../validators/menu.js";

const KITCHEN_ROOM = "kitchen";
const orderRoom = (id) => `order:${id}`;

let io = null;

// Same JSON the REST endpoints send, so the client handles both identically.
const toPlain = (order) => JSON.parse(JSON.stringify(order));

export function initSockets(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.CLIENT_URL } });

  // Runs once per connection, before it is accepted.
  io.use(async (socket, next) => {
    const { token } = socket.handshake.auth ?? {};
    if (!token) return next(); // no token = customer connection

    try {
      // Verifies the JWT and loads the user, same as the REST auth middleware.
      await getUserFromToken(token);
      socket.data.isStaff = true; // only kitchen and owner roles exist
      next();
    } catch (err) {
      if (err.status) return next(err); // invalid or expired token
      console.error(err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.isStaff) socket.join(KITCHEN_ROOM);

    // The optional ack (acknowledgment) tells the client the join is done, so it can safely fetch the order without missing an update. It is sent even for an invalid id, so the client never waits forever.
    socket.on("order:join", (payload, ack) => {
      const parsed = objectId.safeParse(payload?.orderId);
      if (parsed.success) socket.join(orderRoom(parsed.data.toLowerCase()));
      if (typeof ack === "function") ack();
    });
  });

  return io;
}

// Do nothing if sockets were never started (e.g. app.js imported on its own).
export function emitOrderNew(order) {
  io?.to(KITCHEN_ROOM).emit("order:new", toPlain(order));
}

export function emitOrderUpdated(order) {
  io?.to(KITCHEN_ROOM)
    .to(orderRoom(order.id))
    .emit("order:updated", toPlain(order));
}
