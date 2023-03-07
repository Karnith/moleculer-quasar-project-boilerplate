import {
	Method,
	ServiceStarted,
	ServiceStopped,
} from '@ourparentcenter/moleculer-decorators-extended';
import { Service, ServiceBroker, ServiceSchema } from 'moleculer';
import { UserJWT } from 'types';
import { removeForbiddenFields, updateAuthor } from '../helpers';

// create new service factory, inheriting from moleculer native Service
export class BaseService extends Service {
	constructor(broker: ServiceBroker, schema: ServiceSchema) {
		super(broker, schema);
	}

	@Method
	public updateAuthor<T extends Record<string, any>>(
		record: T,
		mod: { creator?: UserJWT; modifier?: UserJWT },
	) {
		return updateAuthor(record, mod);
	}

	@Method
	public removeForbiddenFields<T extends Record<string, any>>(record: T, fields: string[] = []) {
		return removeForbiddenFields(record, fields);
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
