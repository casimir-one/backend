import application from './../controllers/application'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/refs/:agency/:foaId/:hash', application.getApplicationPackageRef)
router.get('/refs/research/:researchId', application.listApplicationsRefsByResearch)
router.get('/refs/foa/:foaId', application.listApplicationsRefsByFoa)
router.post('/upload-files', application.uploadBulkApplicationContent)
router.get('/files/:agency/:foaId/:hash/:formHash', application.getApplicationPackageFormContent)

export default router