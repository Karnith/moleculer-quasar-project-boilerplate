'use strict';
import { roleMongoModel } from '../../models';
import { Config } from '../../common';
import { RolesEntity } from '../../entities';
import { DbBaseMixin } from './db-base.mixin';
import { dbSeed } from './helpers.mixin';

const dbInfo = Config.DB_ROLES;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbRolesMixin',
	collection: dbInfo.collection,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	model: roleMongoModel(dbInfo.collection),
});

export const dbRolesMixin = dbBaseMixin.getMixin(dbSeed(dbInfo, RolesEntity));
export const eventsRolesMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
