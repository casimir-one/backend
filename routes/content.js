import content from './../controllers/content'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/refs/research/:researchId', content.listContentRefs)
router.get('/refs/research/content-id/:refId', content.getContentRefById)
router.get('/refs/research/:researchId/content-hash/:hash', content.getContentRefByHash)
router.get('/refs/research/package/:researchId/:hash/:fileHash', content.getResearchPackageFile)
router.post('/upload-files', content.uploadBulkResearchContent)

export default router