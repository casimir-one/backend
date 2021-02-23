import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import UserBookmark from './../schemas/userBookmark';


class UserBookmarkService extends BaseReadModelService {

  constructor(options = { scoped: true }) { 
    super(UserBookmark, options); 
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