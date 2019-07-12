import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';
import FileRef from './../schemas/fileRef';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findFileRefById, findFileRefByHash } from './../services/fileRef';
import { authorizeResearchGroup } from './../services/auth';
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';

const listFileRefs = async (ctx) => {
  const projectId = ctx.params.projectId;
  try {
    const refs = await FileRef.find({ 'projectId': projectId });
    ctx.status = 200;
    ctx.body = refs;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getFileRefById = async (ctx) => {
  const refId = ctx.params.refId;
  try {
    const ref = await findFileRefById(refId);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getFileRefByHash = async (ctx) => {
  const hash = ctx.params.hash;
  const projectId = ctx.params.projectId;
  try {
    const ref = await findFileRefByHash(projectId, hash);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

export default {
  // refs
  getFileRefById,
  getFileRefByHash,
  listFileRefs
}