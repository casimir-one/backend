import projectsCtrl from '../controllers/impl/ProjectsController';
import proposalsCtrl from '../controllers/impl/ProposalsController';
import teamsCtrl from '../controllers/impl/TeamsController';
import attributesCtrl from '../controllers/impl/AttributesController';
import assetsCtrl from './impl/AssetsController';
import domainsCtrl from './impl/DomainsController';
import usersCtrl from './impl/UsersController';
import authCtrl from './impl/AuthController';
import fundraisingCtrl from './impl/FundraisingController';
import documentTemplatesCtrl from './impl/DocumentTemplatesController';

module.exports = {
  projectsCtrl,
  proposalsCtrl,
  teamsCtrl,
  attributesCtrl,
  assetsCtrl,
  domainsCtrl,
  usersCtrl,
  authCtrl,
  fundraisingCtrl,
  documentTemplatesCtrl
}