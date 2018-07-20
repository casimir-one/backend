import fs from 'fs'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import parseFormdata from 'parse-formdata'
import readArchive from './../dar/readArchive'
import writeArchive from './../dar/writeArchive'
import cloneArchive from './../dar/cloneArchive'
import listArchives from './../dar/listArchives'

const filesStoragePath = path.join(__dirname, './../files');
const DOT = '.'.charCodeAt(0)
const opts = {}

const list = async (ctx) => {
    try {
        const records = await listArchives(filesStoragePath)
        ctx.status = 200;
        ctx.body = records;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const read = async (ctx) => {
    const id = ctx.params.dar || 'default'
    const archiveDir = path.join(filesStoragePath, id);
    const stat = util.promisify(fs.stat);

    try {
        const check = await stat(archiveDir);
        const rawArchive = await readArchive(archiveDir, {
            noBinaryContent: true,
            ignoreDotFiles: true,
            versioning: opts.versioning
        })
        Object.keys(rawArchive.resources).forEach(recordPath => {
        const record = rawArchive.resources[recordPath]
        if (record._binary) {
          delete record._binary
          record.encoding = 'url'
          record.data = `http://localhost:8282/dar/${id}/assets/${record.path}`
        }
      })
      ctx.status = 200;
      ctx.body = rawArchive;

    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const readStatic = async (ctx) => {
    const filePath = path.join(filesStoragePath, ctx.params.dar, ctx.params.file)
    const stat = util.promisify(fs.stat);
    try {
        const check = await stat(filePath);
        await send(ctx, `/files/${ctx.params.dar}/${ctx.params.file}`);
    } catch(err) {
        console.log(err);
        ctx.status = 404;
        ctx.body = err.message;
    }
}

const write = async (ctx) => {
    const id = ctx.params.dar || 'default'

    const formValidation = () => new Promise(resolve => {
        parseFormdata(ctx.req, (err, formData) => {
            if (err) {
                resolve({isSuccess: false, err: err})
            } else {
                resolve({isSuccess: true, formData: formData})
            }
        })
    })


    try {

        const result = await formValidation();
        if (!result.isSuccess) {
            ctx.status = 400;
            ctx.body = result.err.message;
            return;
        }

        const archiveDir = path.join(filesStoragePath, id)
        const stat = util.promisify(fs.stat);
        const check = await stat(archiveDir);

        const archive = JSON.parse(result.formData.fields._archive)

        result.formData.parts.forEach((part) => {
          const filename = part.filename
          const record = archive.resources[filename]
          if (!record) {
            console.error('No document record registered for blob', filename)
          } else {
            // TODO: make sure that this works in different browsers
            record.data = part.stream
          }
        })
        const version = await writeArchive(archiveDir, archive, {
          versioning: opts.versioning
        })
        ctx.status = 200;
        ctx.body = version;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const clone = async (ctx) => {
    const originalPath = path.join(filesStoragePath, ctx.params.dar);
    const newPath = path.join(filesStoragePath, ctx.params.newdar);
    try {
        await cloneArchive(originalPath, newPath);
        ctx.status = 200;
        ctx.body = { status: 'ok' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

export default {
    list,
    read,
    readStatic,
    write,
    clone
}