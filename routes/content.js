import content from './../controllers/content'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

// router.get('/list', dar.listDarArchives)
router.get('/:dar', content.readDarArchive)
router.get('/:dar/assets/:file', content.readDarArchiveStaticFiles)
router.put('/:dar', content.updateDarArchive)

router.get('/refs/research/:researchId', content.listContentRefs)
router.get('/refs/research/:researchId/:hashOrId', content.getContentRef)
router.get('/refs/research/package/:researchId/:hash/:fileHash', content.getResearchPackageFile)

router.delete('/refs/:refId', content.deleteContentDraft)
router.put('/refs/unlock/:refId', content.unlockContentDraft)

router.post('/dar/:researchId', content.createDarArchive)
router.post('/upload-file', content.uploadFileContent)
router.post('/upload-files', content.uploadBulkResearchContent)

export default router