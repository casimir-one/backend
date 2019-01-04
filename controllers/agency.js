import { sendTransaction, getTransaction } from './../utils/blockchain';
import AgencyProfile from './../schemas/agency';
import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import deipRpc from '@deip/deip-rpc-client';

const filesStoragePath = path.join(__dirname, './../files');
const logosStoragePath = () => `${filesStoragePath}/logos`;
const logoPath = (agency) => `${logosStoragePath()}/${agency}`;

const getAgencyProfile = async (ctx) => {
    const agency = ctx.params.agency;
    const profile = await AgencyProfile.findOne({'_id': agency});

    if (!profile) {
        ctx.status = 204;
        ctx.body = null;
        return;
    }

    ctx.status = 200;
    ctx.body = profile;
}

const getAgencyLogo = async (ctx) => {
    const agency = ctx.params.agency;
    const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
    const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
    const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;

    var src = logoPath(agency);
    const stat = util.promisify(fs.stat);

    try {
        const check = await stat(src);
    } catch(err) {
        src = avatarPath("default_agency_logo.png");
    }

    const resize = (w, h) => {
        return new Promise((resolve) => {
            sharp.cache(!noCache);
            sharp(src)
                .rotate()
                .resize(w, h)
                .jpeg()
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
    getAgencyProfile,
    getAgencyLogo
}