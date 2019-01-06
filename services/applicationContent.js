import ApplicationContent from './../schemas/applicationContent';

export async function findApplicationByHashOrId(hashOrId) {
    const ac = await ApplicationContent.findOne({ $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
    return ac;
}

export async function findApplicationPackageByHashOrId(agency, foaId, hashOrId) {
    const ac = await ApplicationContent.findOne({ agency, foaId, $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
    return ac;
}