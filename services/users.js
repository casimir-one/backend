import { foundation_db } from './../db/'

export default class UsersService {

    constructor() {
        this.registrations = foundation_db.createService('preliminary-registrations');;
    }

    async getUserByUsername(username) {
        console.log(username)
        return await this.registrations.findOne({ username: username });
    }
}