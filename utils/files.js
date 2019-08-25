import libre from 'libreoffice-convert';
import crypto from 'crypto';
import fs from 'fs';
import util from 'util';
import path from 'path';

async function docxToPdf(filepath) {
  return new Promise(async function (resolve, reject) {
    const readFile = util.promisify(fs.readFile);
    const writeFile = util.promisify(fs.writeFile);
    const outputPath = `${filepath}.pdf`;
    const input = await readFile(filepath);

    // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)
    libre.convert(input, '.pdf', undefined, async function (err, buf) {
      if (err) {
        reject(err);
      }
      await writeFile(outputPath, buf);
      resolve(outputPath);
    });
  });
}

async function sha256(filepath) {
  return new Promise(async function (resolve, reject) {
    const fd = fs.createReadStream(filepath);
    var hash = crypto.createHash('sha256');
    hash.setEncoding('hex');

    fd.on('end', function () {
      hash.end();
      resolve(hash.read());
    });

    fd.on('error', function (err) {
      reject(err);
    });

    fd.pipe(hash);
  })
}



export default {
  docxToPdf,
  sha256
}