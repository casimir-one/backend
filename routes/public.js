import files from '../controllers/files';
import koa_router from 'koa-router';

const router = koa_router();

router.get('/files/avatars/:picture', files.getAvatar);

export default router;