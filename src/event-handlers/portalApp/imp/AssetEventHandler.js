import {
  APP_EVENT,
  AssetType,
  NftItemMetadataDraftStatus
} from '@casimir.one/platform-core';
import {
  AssetService,
  FTClassService,
  NFTCollectionService,
  NFTItemMetadataDraftService,
  PortalService
} from '../../../services';
import { genSha256Hash } from '@casimir.one/toolbox';
import mongoose from 'mongoose';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';
import config from '../../../config';

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const USER = config.GMAIL_USER;
const CLIENT_ID = config.GMAIL_CLIENT_ID;
const CLIENT_SECRET = config.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = config.GMAIL_REFRESH_TOKEN;

const sendEmailNotification = (to, subject, html) => {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
        CLIENT_ID, // ClientID
        CLIENT_SECRET, // Client Secret
       "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN
  });
  const accessToken = oauth2Client.getAccessToken()


  const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
            type: "OAuth2",
            user: USER, 
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken
      }
  });


  const mailOptions = {
      from: USER,
      to: to,
      subject: subject,
      generateTextFromHTML: true,
      html: html
  };

  smtpTransport.sendMail(mailOptions, (error, response) => {
      error ? console.log(error) : console.log(response);
      smtpTransport.close();
  });

};



class AssetEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const assetEventHandler = new AssetEventHandler();
const assetService = new AssetService();
const ftClassService = new FTClassService();
const nftCollectionService = new NFTCollectionService();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();
const portalService = new PortalService();

assetEventHandler.register(APP_EVENT.FT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    precision,
    maxSupply,
    minBallance,
    description
  } = event.getEventPayload();

  const settings = {
    maxSupply,
    minBallance
  };

  await ftClassService.createFTClass({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: AssetType.FT,
    metadata: settings
  });

  await assetService.createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: AssetType.FT
  });
});


assetEventHandler.register(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, async (event) => {
  const {
    entityId,
    attributes,
    ownerId,
  } = event.getEventPayload();

  await nftCollectionService.createNFTCollection({
    _id: entityId,
    attributes,
    ownerId
  });
});


assetEventHandler.register(APP_EVENT.NFT_COLLECTION_METADATA_UPDATED, async (event) => {
  const {
    _id,
    attributes
  } = event.getEventPayload();

  await nftCollectionService.updateNFTCollection({
    _id,
    attributes
  });
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, async (event) => {

  const {
    nftCollectionId,
    nftItemId,
    entityId,
    authors,
    owner,
    attributes,
    status
  } = event.getEventPayload();

  const _id = mongoose.Types.ObjectId(entityId);

  const draftData = {
    _id,
    nftCollectionId,
    nftItemId,
    hash: '',
    algo: 'sha256',
    owner,
    status: status || NftItemMetadataDraftStatus.IN_PROGRESS,
    authors: authors || [],
    attributes
  }

  draftData.hash = genSha256Hash(JSON.stringify(attributes));

  await nftItemMetadataDraftService.createNFTItemMetadataDraft(draftData);
  await nftCollectionService.increaseNftCollectionNextItemId(nftCollectionId);

  // sendEmailNotification(owner, "Your asset has been uploaded", `<p>Thank you for uploading the asset, we will contact to you after the reviewing step</p>`);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const {
    _id: draftId,
    authors,
    status,
    attributes,
  } = event.getEventPayload();

  let packageHash = '';

  packageHash = genSha256Hash(JSON.stringify(attributes));

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id: draftId,
    authors,
    status,
    hash: packageHash,
    attributes,
  })
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
  const { _id } = event.getEventPayload();

  await nftItemMetadataDraftService.deleteNFTItemMetadataDraft(_id);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED, async (event) => {
  const { _id, moderationMessage } = event.getEventPayload();

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id,
    moderationMessage
  })
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_STATUS_UPDATED, async (event) => {
  const { _id, status } = event.getEventPayload();

  if (status == NftItemMetadataDraftStatus.APPROVED) {
    const queueNumber = await portalService.increasePortalMaxQueueNumber(config.TENANT);
    const updatedDraft = await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
      _id,
      status,
      queueNumber
    });

    // sendEmailNotification(updatedDraft.owner, 
    //   `Your asset has been approved`, 
    //   `<p>Congratulations, <a href="${config.APP_ASSET_DETAILS_BASE_URL}/${_id}">your asset</a> has been approved ! Your queue number is <b>${queueNumber}</b></p>`
    // );
  } else {
    const updatedDraft = await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
      _id,
      status,
    });
    // sendEmailNotification(updatedDraft.owner, 
    //   `Your asset has been declined`, 
    //   `<p>Unfortunately, <a href="${config.APP_ASSET_DETAILS_BASE_URL}/${_id}">your asset</a> has been declined</p>`
    // );
  }

});

module.exports = assetEventHandler;