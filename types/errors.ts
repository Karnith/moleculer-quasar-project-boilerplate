import { constants } from 'http2';

// eslint-disable-next-line no-shadow, @typescript-eslint/naming-convention
export enum userErrorMessage {
	NOT_FOUND = 'user.notfound',
	WRONG = 'user.wrong',
	NOT_ACTIVE = 'user.notactive',
	DUPLICATED_LOGIN = 'user.duplicated.login',
	DUPLICATED_EMAIL = 'user.duplicated.email',
	DELETE_ITSELF = 'user.delete.itself',
}

export enum roleErrorMessage {
	NOT_FOUND = 'role.notfound',
	WRONG = 'role.wrong',
	NOT_ACTIVE = 'role.notactive',
	DUPLICATED_ROLE = 'role.duplicated.name',
	DUPLICATED_VALUE = 'role.duplicated.value',
	DELETE_SYSTEMLOCKED = 'role.delete.systemLocked',
}

export const userErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_LOGIN: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_EMAIL: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ITSELF: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};

export const roleErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_ROLE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_VALUE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_SYSTEMLOCKED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};
