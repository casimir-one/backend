import ExpertiseClaim from './../schemas/expertiseClaim';

const getExpertiseClaimsByUser = async (ctx) => {
    const username = ctx.params.username;
    const expertises = await ExpertiseClaim.find({'username': username})
    ctx.status = 200;
    ctx.body = expertises;
}

const getExpertiseClaimsByUserAndDiscipline = async (ctx) => {
    const username = ctx.params.username;
    const disciplineId = ctx.params.disciplineId;
    const expertises = await ExpertiseClaim.find({'username': username, 'disciplineId': disciplineId})
    ctx.status = 200;
    ctx.body = expertises;
}

const getExpertiseClaimsByDiscipline = async (ctx) => {
    const disciplineId = ctx.params.disciplineId;
    const expertises = await ExpertiseClaim.find({'disciplineId': disciplineId})
    ctx.status = 200;
    ctx.body = expertises;
}

const createExpertiseClaim = async (ctx) => {
    const data = ctx.request.body;
    const jwtUsername = ctx.state.user.username;
    const username = data.username;

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
        ctx.status = 403;
        ctx.body = `You have no permission to create '${username}' expertise claim application`
        return;
    }
    
    const disciplineId = data.disciplineId;
    const coverLetter = data.coverLetter;
    if (!disciplineId || !coverLetter) {
        ctx.status = 404;
        ctx.body = `You must specify discipline you want to claim and provide sgort cover letter`
        return;
    }
    
    const exists = await ExpertiseClaim.count({'username': username, 'disciplineId': disciplineId}) != 0;
    if (exists) {
        ctx.status = 409
        ctx.body = `Expertise claim for "${username}" in discipline ${disciplineId} already exists!`
        return;
    }

    const expertiseClaim = new ExpertiseClaim({
        "username": username,
        "disciplineId": disciplineId,
        "coverLetter": coverLetter,
        "status": 'pending',
        "publications": data.publications,
    })
    const savedExpertiseClaim = await expertiseClaim.save()

    ctx.status = 200
    ctx.body = savedExpertiseClaim
}

export default {
    getExpertiseClaimsByUser,
    getExpertiseClaimsByDiscipline,
    getExpertiseClaimsByUserAndDiscipline,
    createExpertiseClaim
}