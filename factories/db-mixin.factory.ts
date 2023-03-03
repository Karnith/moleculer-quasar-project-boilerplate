// don't remember what this is for..
'use strict';
import { Config } from '../common';
import { DbBaseMixin, dbSeed } from '@Mixins';

export class DBMixinFactory {
	private serviceName: string;
	constructor(serviceName: string) {
		this.serviceName = serviceName;
	}

	createMixin() {
		const model = require('../models')[`${this.serviceName.toLowerCase()}MongoModel`];
		const entity = require('../entities')[`${this.serviceName}Entity`];
		const dbInfo = Config[`DB_${this.serviceName.toUpperCase()}`];
		const dbBaseMixin = new DbBaseMixin({
			dbInfo,
			name: `db${this.serviceName}Mixin`,
			collection: dbInfo.collection,
			model: model(dbInfo.collection),
		});
		return [
			dbBaseMixin.getMixin(dbSeed(dbInfo, entity)),
			dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]),
		];
	}
}
