import BaseService from './../../base/BaseService';
import TokenSchema from './../../../schemas/TokenSchema';
import { TOKEN_LIFETIME } from './../../../constants';

class TokenService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(TokenSchema, options);
  }

  async createToken({
    token,
    refId,
    metadata,
    expirationTime = new Date().getTime() + TOKEN_LIFETIME
  }) {
    const result = await this.createOne({
      token,
      refId,
      metadata,
      expirationTime
    });
    return result;
  }

  async deleteTokenById(id) {
    const result = await this.deleteOne({ _id: id });
    return result;
  }

  async deleteTokenByTokenHash(tokenHash) {
    const result = await this.deleteOne({ token: tokenHash });
    return result;
  }

  async getTokenById(id) {
    const token = await this.findOne({ _id: id });
    if (!token) return null;
    return token;
  }

  async getTokenByTokenHash(tokenHash) {
    const token = await this.findOne({ token: tokenHash });
    if (!token) return null;
    return token;
  }

  async getTokenByRefId(refId) {
    const token = await this.findOne({ refId });
    if (!token) return null;
    return token;
  }

  async getTokens() {
    const tokens = await this.findMany({});
    return tokens;
  }
}

export default TokenService;