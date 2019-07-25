
function uploadSpeedProbeHandler(socket) {
  return async function (msg, ack) {
    if (ack) ack();
    let data = new Uint8Array(msg.data);
    let text = `Got ${data.length} Bytes`;
    socket.emit("upload_speed_probe", { text }, () => { });
    console.log(text);
  }
}


export default {
  uploadSpeedProbeHandler
}