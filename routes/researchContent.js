import researchContent from './../controllers/researchContent'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

// router.get('/list', dar.listDarArchives)
router.get('/:dar', researchContent.readDarArchive)
router.get('/:dar/assets/:file', researchContent.readDarArchiveStaticFiles)
router.put('/:dar', researchContent.updateDarArchive)

router.get('/refs/research/:researchExternalId', researchContent.listContentRefs)
router.get('/refs/research/content-id/:refId', researchContent.getContentRefById)
router.get('/refs/research/:researchExternalId/content-hash/:hash', researchContent.getContentRefByHash)

router.get('/refs/research/package/:researchExternalId/:hash/:fileHash', researchContent.getResearchPackageFile)

router.delete('/refs/:refId', researchContent.deleteContentDraft)
router.put('/refs/unlock/:refId', researchContent.unlockContentDraft)

router.post('/dar/:researchExternalId', researchContent.createDarArchive)
router.post('/upload-files', researchContent.uploadBulkResearchContent)
router.post('/publish', researchContent.createResearchContent)


export default router