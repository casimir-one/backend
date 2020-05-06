import researchContent from './../controllers/researchContent'

import koa_router from 'koa-router'
import config from './../config';

const protected_route = koa_router()
const public_route = koa_router()

// router.get('/list', dar.listDarArchives)
protected_route.get('/:dar', researchContent.readDarArchive)
protected_route.get('/:dar/assets/:file', researchContent.readDarArchiveStaticFiles)
protected_route.put('/:dar', researchContent.updateDarArchive)

public_route.get('/refs/research/:researchExternalId', researchContent.listContentRefs)
public_route.get('/refs/research/content-id/:refId', researchContent.getContentRefById)
public_route.get('/refs/research/:researchExternalId/content-hash/:hash', researchContent.getContentRefByHash)

protected_route.get('/refs/research/package/:researchExternalId/:hash/:fileHash', researchContent.getResearchPackageFile)

protected_route.delete('/refs/:refId', researchContent.deleteContentDraft)
protected_route.put('/refs/unlock/:refId', researchContent.unlockContentDraft)

protected_route.post('/dar/:researchExternalId', researchContent.createDarArchive)
protected_route.post('/upload-files', researchContent.uploadBulkResearchContent)
protected_route.post('/publish', researchContent.createResearchContent)


const routes = {
  protected: koa_router().use('/content', protected_route.routes()),
  public: koa_router().use('/content', public_route.routes())
}

module.exports = routes;