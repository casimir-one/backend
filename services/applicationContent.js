import ApplicationContent from './../schemas/applicationContent';

export async function findApplicationPackageByHash(agency, foaId, hash) {
    const ac = await ApplicationContent.findOne({ agency, foaId, hash });
    return ac;
}