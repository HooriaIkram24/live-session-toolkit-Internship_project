// lib/socket.js
// A single shared Socket.IO client connection, reused across components.

import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(); // connects to the same host that served the page
  }
  return socket;
}
