import { server_db } from './../db/'

export default class ContentService {

    constructor() {
        this.content = server_db.createService('research-content');;
    }

    async findOne(researchId, hash) {
        return await this.content.findOne({ '_id': `${researchId}_${hash}` });
    }

    async count(id) {
        return await this.content.count({ _id: id });
    }

    async create(doc) {
        return await this.content.create(doc);
    }
}