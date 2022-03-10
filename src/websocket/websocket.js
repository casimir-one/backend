import EventEmitter from 'events';
import { logError } from "../utils/log";

const parseMessage = (data) => {
  const json = JSON.parse(data);
  const [type, payload] = json;
  return [type, payload];
}

const serializeMessage = (type, payload) => {
  return JSON.stringify([type, payload]);
}

export class WS extends EventEmitter {
  constructor(websocket) {
    super();
    this._bindSocket(websocket);
  }

  _bindSocket(websocket) {
    this.websocket = websocket;
    if (this.websocket.readyState !== 1) {  // OPEN
      // Listen for the open event, and buffer new messages until then.
      this.websocket.addEventListener('open', () => {
        this.sendBufferedMessages();
        this.isOpen = true;
        this.emit('connect', this);
      });
      this.isOpen = false;
    } else {
      this.isOpen = true;
    }

    this.websocket.addEventListener('close', async event => {
      if (this.isOpen)
        this.emit('disconnect', event.code, event.reason);
      this.isOpen = false;
    });

    this.websocket.addEventListener('message', message => {
      const { data } = message;
      try {
        const [type, payload] = parseMessage(data);
        this.emit(type, payload);
      } catch (e) {
        logError('Failed to parse message:', e);
      }
    });

    this.websocket.addEventListener('error', err => {
      logError(err);
    });
  }


  sendBufferedMessages() {
    if (this.websocket.readyState !== 1) {
      throw new Error('Cannot send buffered messages on a non-open websocket!');
    }
    for (const msg of this.buffer) {
      this.websocket.send(msg);
    }
    this.buffer.length = 0;
  }

  send(msg, payload) {
    if (this.isOpen) {
      this.websocket.send(serializeMessage(msg, payload));
    } else {
      this.buffer.push(serializeMessage(msg, payload));
    }
  }

  close() {
    this.websocket = null;
    this.isOpen = false;
  }
}





