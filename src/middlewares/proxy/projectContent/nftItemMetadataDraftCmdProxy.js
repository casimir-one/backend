import { NftItemMetadataDraftService, PortalService, NftCollectionMetadataService } from '../../../services';

const portalService = new PortalService();
const nftItemMetadataDraftService = new NftItemMetadataDraftService();
const nftCollectionMetadataService = new NftCollectionMetadataService();


function nftItemMetadataDraftCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const draftId = ctx.request.header['entity-id'];
    const nftCollectionId = ctx.request.header['nft-collection-id'];

    if (ctx.req.method === "POST") {
      ctx.assert(!!nftCollectionId, 404);
      const project = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);
      ctx.assert(!!project, 404);
    }

    const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(draftId);

    if (ctx.req.method === "PUT") {
      ctx.assert(!!draft, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && draft.portalId == currentPortal.id)) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(draft.portalId);
      if (false) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.status = 307;
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = nftItemMetadataDraftCmdProxy;
