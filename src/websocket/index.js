import { WebSocketServer } from 'ws';
import { WS } from "./websocket";
import { verifySocketClient } from "./auth";
import { logInfo, logWarn, logError } from "../utils/log";

const WS_HOST = process.env.WS_HOST || '0.0.0.0';
const WS_PORT = process.env.WS_PORT || 8083;

const wss = new WebSocketServer({
  host: WS_HOST,
  port: WS_PORT,
  verifyClient: verifySocketClient,
  minVersion: 'TLSv1',
  maxVersion: 'TLSv1.3',
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

})

wss.on('error', (error) => {
  logError("WSS error:", error)
})

wss.on('close', (arg) => {
  logInfo("WSS close:", arg)
})

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

export const socketServer = {
  sendEvent,
}

