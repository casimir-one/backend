import deipRpc from '@deip/deip-rpc-client';
import ApplicationContent from './../schemas/applicationContent';

export async function findApplicationByHashOrId(hashOrId) {
    const rc = await ApplicationContent.findOne({ $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
    return rc;
}