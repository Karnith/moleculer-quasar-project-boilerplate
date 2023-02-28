/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { dbAuthMixin, eventsAuthMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import {
	IUser,
	UserAuthMeta,
	UserRoleDefault,
	UserRolesParams,
	UserServiceSettingsOptions,
	UserTokenParams,
} from '../../types';
import { userErrorCode, userErrorMessage } from '../../types/errors';
import { BaseServiceWithDB } from '../../factories';

@Service({
	name: 'auth',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.AUTH_SERVICE_TOKEN,
	/**
	 * Mixins
	 */
	// @ts-ignore
	mixins: [dbAuthMixin, eventsAuthMixin],
	/**
	 * Settings
	 */
	settings: {
		$dependencyTimeout: 30000, // Default: 0 - no timeout
		idField: '_id',
		pageSize: 10,
		// Base path
		rest: '/',
		// rest: '/v1/user',
		// user jwt secret
		JWT_SECRET: Config.JWT_SECRET,
		// Available fields in the responses
		fields: [
			'_id',
			'login',
			'firstName',
			'lastName',
			'email',
			'langKey',
			'roles',
			'verificationToken',
			'active',
			'createdBy',
			'createdDate',
			'lastModifiedBy',
			'lastModifiedDate',
		],
		// additional fields added to responses
		populates: {
			createdBy: {
				action: 'v1.user.id',
				params: { fields: ['login', 'firstName', 'lastName'] },
				// params: { fields: 'login firstName lastName' },
			},
			lastModifiedBy: {
				action: 'v1.user.id',
				params: { fields: ['login', 'firstName', 'lastName'] },
				// params: { fields: 'login firstName lastName' },
			},
		},
	},
	dependencies: 'v1.user',
})
export default class AuthService extends BaseServiceWithDB<UserServiceSettingsOptions, IUser> {
	@Action({
		name: 'resolveToken',
		restricted: ['api'],
		cache: {
			keys: ['token'],
			ttl: 30 * 60, // 0,5 hour
		},
		params: {
			token: 'string',
		},
	})
	async resolveToken(ctx: Context<UserTokenParams, Record<string, unknown>>) {
		try {
			this.logger.debug('♻ Attempting to resolve token...');
			const key = Buffer.from(this.settings.JWT_SECRET, 'hex');
			const { payload, protectedHeader }: { payload: any; protectedHeader: any } =
				await jwtDecrypt(
					ctx.params.token,
					key /* , {
						issuer: 'urn:example:issuer',
						audience: 'urn:example:audience',
					} */,
				);
			if (protectedHeader && payload.data._id) {
				// returns user from payload _id
				return await this._get(ctx, { id: payload.data._id });
			}
		} catch (err) {
			this.logger.error('♻ Error resolving token', ctx.params.token, err);
			return err;
		}
	}

	@Action({
		name: 'validateRole',
		restricted: ['api'],
		cache: {
			keys: ['roles', 'user'],
		},
		params: {
			roles: { type: 'array', items: 'string', enum: Object.values(UserRoleDefault) },
		},
	})
	async validateRole(ctx: Context<UserRolesParams, UserAuthMeta>) {
		this.logger.debug('♻ Attempting to validate roles...');
		const roles = ctx.params.roles;
		const userRoles = ctx.meta.user.roles;
		return !roles || !roles.length || roles.some((r) => userRoles!.includes(r));
	}

	@Action({
		name: 'createJWT',
		restricted: ['api', 'user'],
		cache: {
			keys: ['roles', 'user'],
		},
		params: {
			roles: { type: 'array', items: 'string', enum: Object.values(UserRoleDefault) },
		},
	})
	async createJWT(ctx: Context<IUser>) {
		try {
			this.logger.debug('♻ Attempting to create user JWT...');
			const user: IUser = ctx.params;
			if (user && typeof user === 'object') {
				if (!user.active) {
					this.logger.error('♻ User not found or disabled');
					throw new moleculer.Errors.MoleculerClientError(
						userErrorMessage.WRONG,
						userErrorCode.WRONG,
						'',
						[{ message: 'Error: User not found or disabled' }],
					);
				} else {
					this.logger.debug('♻ Generating user JWT...');
					return await this.generateJWT(user);
				}
			}
		} catch (err) {
			this.logger.error('♻ An error occured creating User JWT: ', err);
			return err;
		}
	}

	@Method
	async generateJWT(user: IUser) {
		this.logger.debug('♻ Generating JWT');
		const exp = new Date();
		this.logger.debug('♻ Creating key');
		const key = Buffer.from(this.settings.JWT_SECRET, 'hex');
		this.logger.debug('♻ Setting JWT exiration date');
		exp.setDate(exp.getDate() + 60);
		try {
			const userJWT = await new EncryptJWT({
				data: user,
				// exp: Math.floor(exp.getTime() / 1000),
			})
				.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
				// .setIssuedAt()
				// .setIssuer()
				// .setAudience()
				.setExpirationTime(Math.floor(exp.getTime() / 1000))
				.encrypt(key);
			return userJWT;
		} catch (err) {
			this.logger.debug('♻ Error generating JWT: ', err);
			return err;
		}
	}
}
