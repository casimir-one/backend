import { WebSocketServer } from 'ws';
import { WS } from "./websocket";
import { verifySocketClient } from "./auth";
import { logInfo, logWarn, logError } from "../utils/log";


let instance;

const getSocketServerInstance = function() {
  if (!instance) {
    throw new Error("WebSocketServer is not initialized");
  }

  return instance;
};


const init = function(server) {

  if (instance) {
    throw new Error("WebSocketServer is already initialized");
  }

  const wss = new WebSocketServer({
    server: server,
    verifyClient: verifySocketClient
  });

  const usernameToSocket = new Map(); // username -> WS

  const addConnection = (info, ws) => {
    const { username } = info;
    usernameToSocket.set(username, ws);
  }

  const deleteConnection = (info) => {
    const { username } = info;
    usernameToSocket.delete(username);
  }

  wss.on('listening', () => {
    logInfo("WSS server listening on", wss.address())
  })

  wss.on('connection', (websocket, req) => {
    logInfo(`WSS Client connection ...`);

    const ws = new WS(websocket);
    addConnection(req.info, ws);

    ws.on('disconnect', (code, reason) => {
      deleteConnection(req.info)
      logWarn(`WSS Client disconnected: ${code} Reason: ${reason}`);
    });

    ws.on('error', (error) => {
      logWarn(`WSS Client error:`, error);
    });

    ws.on('close', (arg) => {
      logWarn(`WSS Client closed:`, arg);
    });

  });

  wss.on('error', (error) => {
    logError("WSS error:", error)
  });

  wss.on('close', (arg) => {
    logInfo("WSS close:", arg)
  });

  const _send = (msg, payload, username) => {
    const client = usernameToSocket.get(username);
    if (client) client.send(msg, payload);
  }

  const sendEvent = (event, errors) => {
    const eventIssuerUsername = event.getEventIssuer();
    if (!eventIssuerUsername) return;

    const message = `Event${errors.length ? "Error" : "Success"}`;
    const payload = { event: JSON.parse(event.toString()), errors};

    return _send(message, payload, eventIssuerUsername)
  }

  instance = {
    sendEvent
  }

}


module.exports = {
  init,
  getSocketServerInstance
};