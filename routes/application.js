import application from './../controllers/application'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/refs/:agency/:foaId/:hash', application.getApplicationPackageRef)
router.get('/refs/research/:researchId', application.listApplicationsRefsByResearch)
router.get('/refs/foa/:foaId', application.listApplicationsRefsByFoa)
router.get('/refs/similar/:letterHash', application.listApplicationsRefsByLetterHash)
router.post('/upload-files', application.uploadBulkApplicationContent)
router.get('/files/:agency/:foaId/:hash/:formHash', application.getApplicationPackageFormContent)
router.put('/refs/update-status', application.updateApplicationRefStatus)

export default router