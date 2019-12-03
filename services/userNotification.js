import UserNotification from './../schemas/userNotification';

async function createUserNotification({
	username,
	status,
	type,
	metadata
}) {
	let notification = new UserNotification({
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