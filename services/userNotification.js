import UserNotification from './../schemas/userNotification';
import config from './../config';

async function createUserNotification({
	username,
	status,
	type,
	metadata
}) {
	let notification = new UserNotification({
    tenantId: config.TENANT,
		username,
		status,
		type,
		metadata
	});
	let savedNotification = await notification.save();
	return savedNotification;
}

export {
	createUserNotification
}