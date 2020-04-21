import { sendTransaction, getTransaction } from './../utils/blockchain';
import AgencyProfile from './../schemas/agency';
import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import deipRpc from '@deip/rpc-client';
import config from './../config';

const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const logoPath = (agency, ext) => `${filesStoragePath}/agencies/${agency}/logo.${ext}`;

const getTenantProfile = async (ctx) => {
    const tenant = ctx.params.tenant;
    const profile = await AgencyProfile.findOne({ '_id': tenant});

    if (!profile) {
        ctx.status = 204;
        ctx.body = null;
        return;
    }

    ctx.status = 200;
    ctx.body = profile;
}

const getTenantsProfiles = async (ctx) => {
    const profiles = await AgencyProfile.find();
    ctx.status = 200;
    ctx.body = profiles;
}

const getTenantLogo = async (ctx) => {
    const tenant = ctx.params.tenant;
    const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
    const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
    const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
    const ext = ctx.query.ext ? ctx.query.ext : 'png';

    var src = logoPath(tenant, ext);
    const stat = util.promisify(fs.stat);

    try {
        const check = await stat(src);
    } catch(err) {
        ctx.status = 404;
        return;
    }

    const resize = (w, h) => {
        return new Promise((resolve) => {
            sharp.cache(!noCache);
            sharp(src)
                .rotate()
                .resize(w, h)
                .png()
                .toBuffer()
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    resolve(err)
                });
            })
    }

    const logo = await resize(width, height);
    ctx.type = 'image/jpeg';
    ctx.body = logo;
}


export default {
    getTenantProfile,
    getTenantsProfiles,
    getTenantLogo
}