import { NftCollectionMetadataService, NftItemMetadataService, PortalService } from '../../../services';

const portalService = new PortalService();
const nftCollectionMetadataService = new NftCollectionMetadataService();
const nftItemMetadataService = new NftItemMetadataService();


function nftItemCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const projectContentId = ctx.request.header['entity-id'];
    const nftCollectionId = ctx.request.header['nft-collection-id'];

    if (ctx.req.method === "POST" || ctx.req.method === "PUT") {
      ctx.assert(!!nftCollectionId, 404);
      const project = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);
      ctx.assert(!!project, 404);
    }

    const projectContent = await nftItemMetadataService.getNftItemMetadata(projectContentId);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!projectContent, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && projectContent.portalId == currentPortal.id)) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(project.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.status = 307;
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = nftItemCmdProxy;
