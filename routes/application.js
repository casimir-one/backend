import grantApplications from './../controllers/grantApplications'

import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/refs/:agency/:foaId/:hash', grantApplications.getApplicationPackageRef)
router.get('/refs/research/:researchId', grantApplications.listApplicationsRefsByResearch)
router.get('/refs/foa/:foaId', grantApplications.listApplicationsRefsByFoa)
router.post('/upload-files', grantApplications.uploadBulkApplicationContent)
router.get('/files/:agency/:foaId/:hash/:formHash', grantApplications.getApplicationPackageFormContent)

export default router