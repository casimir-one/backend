import JoinRequest from './../schemas/joinRequest'
import deipRpc from '@deip/deip-rpc';

const getJoinRequestsByGroup = async (ctx) => {
    const groupId = parseInt(ctx.params.groupId);
    const jwtUsername = ctx.state.user.username;

    if (isNaN(groupId)) {
        ctx.status = 400;
        ctx.body = `"${ctx.params.groupId}" is invalid group id`;
        return;
    }

    try {
        const requests = await JoinRequest.find({'groupId': groupId})
        ctx.status = 200
        ctx.body = requests;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}


const getJoinRequestsByUser = async (ctx) => {
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    try {
        const requests = await JoinRequest.find({'username': username})
        ctx.status = 200
        ctx.body = requests;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}


const createJoinRequest = async (ctx) => {
    const data = ctx.request.body;
    const username = data.username;
    const groupId = data.groupId !== undefined ? parseInt(data.groupId) : NaN;
    const coverLetter = data.coverLetter;
    const jwtUsername = ctx.state.user.username;
    const isRequestEmitter = username === jwtUsername;

    if (!username || isNaN(groupId) || !coverLetter) {
        ctx.status = 400;
        ctx.body = `"username", "groupId" and "coverLetter" fields must be specified`
        return;
    }

    if (!isRequestEmitter) {
        ctx.status = 400;
        ctx.body = `Join request should be sent by "${usename} account owner`
        return;
    }
    
    const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);

    if (rgtList.some(rgt => rgt.research_group_id == groupId)) {
        ctx.status = 400;
        ctx.body = `"${username}" is member of "${groupId}" group already`
        return;
    }

    try {
        const exists = await JoinRequest.find({'groupId': groupId, 'username': username, 'status': { $in: ['Approved', 'Pending'] }}) != 0;
        if (exists) {
            ctx.status = 409
            ctx.body = `"${username}" has active join request for "${groupId}" group already`
            return;
        }
    
        const joinRequest = new JoinRequest({
            username: username,
            groupId: groupId,
            coverLetter: coverLetter,
            status: 'Pending'
        });
        const savedJoinRequest = await joinRequest.save()
    
        ctx.status = 200
        ctx.body = savedJoinRequest;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}



const updateJoinRequest = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const data = ctx.request.body;
    const updatedJoinRequest = data.request;
    const tx = data.tx;

    try {

        if (!updatedJoinRequest) {
            ctx.status = 400;
            ctx.body = `Expected updated Join Request object, but found ${updatedJoinRequest}`
            return;
        }

        const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(jwtUsername);
        console.log(rgtList)

        if (!rgtList.some(rgt => rgt.research_group_id == updatedJoinRequest.groupId)){
            ctx.status = 403;
            ctx.body = `You have no permission to post proposals in '${updatedJoinRequest.groupId}' group`
            return;
        }

        if (tx && updatedJoinRequest.status == 'Approved') {
            async function sendTransaction() {
                let promise = new Promise((resolve) => {
                    deipRpc.api.broadcastTransactionSynchronous(tx, function(err, result) {
                        if (err) {
                            console.log(err);
                            resolve({isSuccess:false})
                        } else {
                            console.log(result);
                            resolve({isSuccess:true})
                        }
                    });
                });
                return await promise;
              }

              const result = await sendTransaction();
              console.log(result);

              if (!result.isSuccess) {
                ctx.status = 500
                ctx.body = `Internal server error, please try again later`;
                return;
              }
        }

        const joinRequest = await JoinRequest.findOne({'groupId': updatedJoinRequest.groupId, 'username': updatedJoinRequest.username, 'status': 'Pending'})
        joinRequest.status = updatedJoinRequest.status;

        const updated = await joinRequest.save()
        ctx.status = 200;
        ctx.body = updated

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}


export default {
    getJoinRequestsByGroup,
    getJoinRequestsByUser,
    createJoinRequest,
    updateJoinRequest
}