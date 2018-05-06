import koa_router from 'koa-router'
import files from '../controllers/files.js'
import fs from 'fs';
import path from 'path';
import multer from 'koa-multer';
import md5File from 'md5-file';
import ContentService from '../services/content.js';

const router = koa_router()

router.post('/files/upload-content', files.uploadContent)

export default router