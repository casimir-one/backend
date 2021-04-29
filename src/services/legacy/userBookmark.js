import BaseService from './../base/BaseService';
import UserBookmarkSchema from './../../schemas/write/UserBookmarkSchema';


class UserBookmarkService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(UserBookmarkSchema, options);
  }


  async getUserBookmarks(username, type, ref) {
    const query = { username };

    if (type) {
      query.type = type;
    }

    if (ref) {
      query.ref = ref;
    }

    const result = await this.findMany(query);
    return result;
  }


  async createUserBookmark({
    username,
    type,
    ref
  }) {

    const result = await this.createOne({
      username,
      type,
      ref
    });
    return result;
  }


  async removeUserBookmark(id) {
    const result = await this.deleteOne({ _id: id});
    return result;
  }

}

export default UserBookmarkService;