import {
	Method,
	ServiceStarted,
	ServiceStopped,
} from '@ourparentcenter/moleculer-decorators-extended';
import { ServiceBroker, ServiceSchema } from 'moleculer';
import { MoleculerDBService, UserJWT } from '../types';

// create new service factory, inheriting from moleculer native Service
export class BaseServiceWithDB<ServiceSettingsOptions, Entity> extends MoleculerDBService<
	ServiceSettingsOptions,
	Entity
> {
	constructor(broker: ServiceBroker, schema: ServiceSchema<ServiceSettingsOptions>) {
		super(broker, schema);
	}

	@Method
	public updateAuthor<T extends Record<string, any>>(
		record: T,
		mod: {
			creator?: UserJWT;
			modifier?: UserJWT;
		},
	) {
		const { creator, modifier } = mod;
		let result = { ...record };
		if (creator || creator == null || creator == undefined) {
			if (creator != null || creator != undefined) {
				result = { ...result, createdBy: creator._id, createdDate: new Date() };
			} else {
				if (!result.createdDate) {
					result = { ...result, createdBy: null, createdDate: new Date() };
				}
			}
		}
		if (modifier || modifier == null || modifier == undefined) {
			if (modifier != null || modifier != undefined) {
				result = { ...result, lastModifiedBy: modifier._id, lastModifiedDate: new Date() };
			} else {
				result = { ...result, lastModifiedBy: null, lastModifiedDate: new Date() };
			}
		}
		return result;
	}

	@Method
	public removeForbiddenFields<T extends Record<string, any>>(record: T) {
		const result = { ...record };
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result._id;
		// delete (user as any).id;

		// delete result.login;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result.createdDate;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result.createdBy;
		delete result.lastModifiedDate;
		delete result.lastModifiedBy;
		return result;
	}

	@ServiceStarted()
	serviceStarted() {
		this.logger.debug(
			`♻ ${this.fullName.toUpperCase()} service started, ready for connections`,
		);
	}

	@ServiceStopped()
	serviceStopped() {
		this.logger.debug(
			`♻ ${this.fullName.toUpperCase()} service stopped, connections terminated`,
		);
	}
}
