import { UserJWT } from 'types';

export const updateAuthor = <T extends Record<string, any>>(
	record: T,
	mod: {
		creator?: UserJWT;
		modifier?: UserJWT;
	},
): T => {
	const { creator, modifier } = mod;
	let result = { ...record };
	creator ? (result = { ...result, createdBy: creator._id, createdDate: new Date() }) : null;
	/* if (creator || creator == null || creator == undefined) {
			if (creator != null || creator != undefined) {
				result = { ...result, createdBy: creator._id, createdDate: new Date() };
			} else {
				if (!result.createdDate) {
					result = { ...result, createdBy: null, createdDate: new Date() };
				}
			}
		} */
	modifier
		? (result = { ...result, lastModifiedBy: modifier._id, lastModifiedDate: new Date() })
		: null;
	/* if (modifier || modifier == null || modifier == undefined) {
			if (modifier != null || modifier != undefined) {
				result = { ...result, lastModifiedBy: modifier._id, lastModifiedDate: new Date() };
			} else {
				result = { ...result, lastModifiedBy: null, lastModifiedDate: new Date() };
			}
		} */
	return result;
};

export const removeForbiddenFields = <T extends Record<string, any>>(
	record: T,
	fields: string[] = [],
): T => {
	const result = { ...record };
	fields.forEach((field) => {
		delete result[field];
	});
	/* delete result._id;
		delete result.createdDate;
		delete result.createdBy;
		delete result.lastModifiedDate;
		delete result.lastModifiedBy; */
	return result;
};
