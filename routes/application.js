import application from './../controllers/application'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/refs/:hashOrId', application.getApplicationRef)
router.get('/refs/research/:researchId', application.listApplicationsRefsByResearch)
router.get('/refs/foa/:foaId', application.listApplicationsRefsByFoa)
router.post('/upload-file', application.uploadApplicationContent)
router.post('/upload-files', application.uploadBulkApplicationContent)
router.get('/files/:agency/:hashOrId', application.getApplicationContent)
router.get('/files/:agency/:foaId/:hashOrId/:formHash', application.getApplicationPackageFormContent)

export default router