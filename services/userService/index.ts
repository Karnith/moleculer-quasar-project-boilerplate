/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { constants } from 'http2';
import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import { Config } from '../../common';
import randomstring from 'randomstring';
import {
	getActionConfig,
	IUser,
	listActionConfig,
	RestOptions,
	UserAuthMeta,
	UserCreateParams,
	UserDeleteParams,
	UsersDeleteParams,
	UserEvent,
	UserGetParams,
	UserLoginMeta,
	UserLoginParams,
	UserRoleDefault,
	UserServiceSettingsOptions,
	UsersServiceOptions,
	UserUpdateParams,
	UserActivateParams,
	userErrorCode,
	userErrorMessage,
} from '../../types';

import { UserEntity } from '@Entities';
import { BaseServiceWithDB, DBMixinFactory } from '@Factories';

const validateUserBase: ActionParams = {
	login: 'string',
	email: 'email',
	firstName: 'string',
	lastName: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	roles: { type: 'array', items: 'string', optional: true },
	langKey: { type: 'string', min: 2, max: 5, optional: true },
};

const validateUserBaseOptional: ActionParams = {
	login: { type: 'string', optional: true },
	email: { type: 'email', optional: true },
	firstName: { type: 'string', optional: true },
	lastName: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	roles: { type: 'array', items: 'string', optional: true },
	langKey: { type: 'string', min: 2, max: 5, optional: true },
	requireRegToken: { type: 'boolean', optional: true },
};

const encryptPassword = (password: string) =>
	bcrypt.hashSync(password, JSON.parse(Config.SALT_VALUE));

@Service<UsersServiceOptions>({
	name: 'user',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.USER_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [...new DBMixinFactory('User').createMixin()],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		pageSize: 10,
		// Base path
		rest: '/',
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
			},
		},
	},
})
export default class UserService extends BaseServiceWithDB<UserServiceSettingsOptions, IUser> {
	@Action({
		name: 'id',
		restricted: ['api', 'user', 'roles', 'auth'],
		...getActionConfig,
	})
	async getUserId(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Attempting to get user by id...');
		const result = await this._get(ctx, await params);
		this.logger.debug('♻ Returning result');
		return result;
	}

	@Action({
		name: 'activate',
		restricted: ['api'],
		params: {
			verificationToken: 'string',
		},
	})
	async activateUser(ctx: Context<UserActivateParams, UserAuthMeta>) {
		this.logger.debug('♻ Attempting to activate user...');
		const foundUser: Record<string, unknown> = (await this.adapter.findOne({
			verificationToken: ctx.params.verificationToken,
		})) as Record<string, unknown>;
		this.logger.debug('♻ User found, activating user...');
		const activateUser = await ctx.call('v1.user.update', { id: foundUser._id, active: true });
		this.logger.debug('♻ Returning activated user object');
		return activateUser;
	}

	/**
	 *  @swagger
	 *
	 *  /auth/register:
	 *    post:
	 *      tags:
	 *      - "Auth"
	 *      summary: Register user
	 *      description: Register a user
	 *      operationId: registerUser
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              allOf:
	 *                - $ref: '#/components/schemas/User'
	 *                - required:
	 *                  - login
	 *                  - firstName
	 *                  - lastName
	 *                  - email
	 *                  - password
	 *                  - langKey
	 *      responses:
	 *        200:
	 *          description: Register user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *                - $ref: '#/components/schemas/VerificationToken'
	 *                - $ref: '#/components/schemas/UserAdditional'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Action({
		name: 'register',
		// roles: UserRole.SUPERADMIN,
		restricted: ['api'],
		params: {
			...validateUserBase,
			password: 'string',
		},
	})
	async registerUser(ctx: Context<UserCreateParams, UserAuthMeta>) {
		const entity = ctx.params;
		this.logger.debug('♻ Checking if user login or email already exist...');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundLogin = await this.adapter.findOne<IUser>({ login: entity.login });
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundEmail = await this.adapter.findOne<IUser>({ email: entity.email });
		if (foundLogin) {
			this.logger.error(`♻ User ${entity.login} already registered`);
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_LOGIN,
				userErrorCode.DUPLICATED_LOGIN,
				'',
				[{ field: 'login', message: 'duplicated' }],
			);
		}

		if (foundEmail) {
			this.logger.error(`♻ User ${entity.email} already registered`);
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_EMAIL,
				userErrorCode.DUPLICATED_EMAIL,
				'',
				[{ field: 'email', message: 'duplicated' }],
			);
		}

		this.logger.debug('♻ User login and email not duplicated, continuing with user creation');
		entity.password = encryptPassword(entity.password);
		entity.roles = JSON.parse(Config.defaultRoles);

		const parsedEntity = this.removeForbiddenFields<IUser>(
			new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		const modEntity = this.updateAuthor(parsedEntity, { creator: ctx.meta.user || null });
		const addVerificationToken = this.addVerificationToken(
			modEntity,
			Boolean(Config.registrationTokenRequired),
		);
		this.logger.debug('♻ Creating user...');
		return this._create(ctx, addVerificationToken);
	}

	/**
	 *  @swagger
	 *
	 *  /auth/login:
	 *    post:
	 *      tags:
	 *      - "Auth"
	 *      summary: Login a user
	 *      description: Login a user.
	 *      operationId: loginUser
	 *      requestBody:
	 *        required: true
	 *        content:
	 *           application/json; charset=utf-8:
	 *              schema:
	 *                required:
	 *                - login
	 *                - password
	 *                type: object
	 *                properties:
	 *                  login:
	 *                    type: string
	 *                    description: user login name
	 *                    example: superadmin
	 *                  password:
	 *                    type: string
	 *                    description: user password
	 *                    example: 123456
	 *      responses:
	 *        200:
	 *          description: Login user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Action({
		name: 'login',
		restricted: ['api'],
		params: {
			login: { type: 'string' },
			password: { type: 'string', min: 1 },
		},
	})
	async loginUser(ctx: Context<UserLoginParams, UserLoginMeta>) {
		this.logger.debug('♻ Attempting to login user...');
		try {
			const { login, password } = ctx.params;

			const usrLogin = login.includes('@') ? 'email' : 'login';
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const result: any = await this.adapter
				.findOne<IUser>({ [usrLogin]: login } as any)
				.then((res) => {
					if (res) {
						this.logger.debug('♻ User found');
						return res;
					}
					this.logger.error('♻ login/password incorrect');
					throw new moleculer.Errors.MoleculerClientError(
						userErrorMessage.WRONG,
						userErrorCode.WRONG,
						'',
						[{ field: 'login/password', message: 'login/password incorrect' }],
					);
				})
				.catch((err) => {
					this.logger.error('♻ login/password incorrect: ', err);
					throw new moleculer.Errors.MoleculerClientError(
						userErrorMessage.WRONG,
						userErrorCode.WRONG,
						'',
						[{ field: 'login/password', message: 'login/password incorrect' }],
					);
				});

			if (!result.active) {
				this.logger.error('♻ User not active');
				throw new moleculer.Errors.MoleculerClientError(
					userErrorMessage.NOT_ACTIVE,
					userErrorCode.NOT_ACTIVE,
					'',
					[{ field: 'disabled', message: 'user not active' }],
				);
			}
			this.logger.debug('♻ Attempting to validate password');
			const valid = await bcrypt.compare(password, result.password);
			if (!valid) {
				this.logger.error('♻ User credentials incorrect');
				throw new moleculer.Errors.MoleculerClientError(
					userErrorMessage.WRONG,
					userErrorCode.WRONG,
					'',
					[{ field: 'login/password', message: 'login/password incorrect' }],
				);
			}

			const user: IUser = (await this.transformDocuments(ctx, {}, result)) as IUser;
			this.logger.debug('♻ Generating user JWT...');
			const token: any = await ctx.call('v1.auth.createJWT', user);
			if (token.code) {
				return token;
			}

			this.logger.debug('♻ Setting Authorization Bearer to request');
			ctx.meta.$responseHeaders = { Authorization: `Bearer ${token}` };
			this.logger.debug('♻ Returning user and token object');
			return { user: user, token };
		} catch (err) {
			this.logger.error('♻ Login error occured: ', err);
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/logout:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: Logout user
	 *      description: Logout current user.
	 *      operationId: logout
	 *      responses:
	 *        200:
	 *          description: Logout user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Get<RestOptions>('/logout', {
		name: 'logout',
		restricted: ['api'],
	})
	logout(ctx: Context<Record<string, unknown>, UserAuthMeta>) {
		this.logger.debug('♻ Logging user out');
		console.log('user logout', ctx.meta.user);
		console.log('headers: ', ctx.meta);
		return { logout: true, user: ctx.meta.user };
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user:
	 *    post:
	 *      tags:
	 *      - "Users"
	 *      summary: Create user
	 *      description: Create a user
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              allOf:
	 *                - $ref: '#/components/schemas/User'
	 *                - required:
	 *                  - login
	 *                  - firstName
	 *                  - lastName
	 *                  - email
	 *                  - password
	 *                  - langKey
	 *              anyOf:
	 *              - type: object
	 *                properties:
	 *                  requireRegToken:
	 *                    type: boolean
	 *                    description: Require registration token
	 *                    example: true
	 *      responses:
	 *        200:
	 *          description: Create user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *                - $ref: '#/components/schemas/VerificationToken'
	 *                - $ref: '#/components/schemas/UserAdditional'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/', {
		name: 'create',
		roles: UserRoleDefault.SUPERADMIN,
		restricted: ['api'],
		params: {
			...validateUserBase,
			password: 'string',
			requireRegToken: { type: 'boolean', optional: true },
		},
	})
	async createUser(ctx: Context<UserCreateParams, UserAuthMeta>) {
		const entity = ctx.params;
		this.logger.debug('♻ Attempting to find if user login already exists...');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundLogin = await this.adapter.findOne<IUser>({ login: entity.login });
		if (foundLogin) {
			this.logger.error('♻ User login already exists...');
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_LOGIN,
				userErrorCode.DUPLICATED_LOGIN,
				'',
				[{ field: 'login', message: 'login not available' }],
			);
		}
		this.logger.debug('♻ Attempting to find if user email already exists...');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundEmail = await this.adapter.findOne<IUser>({ email: entity.email });
		if (foundEmail) {
			this.logger.error('♻ User email already exists...');
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_EMAIL,
				userErrorCode.DUPLICATED_EMAIL,
				'',
				[{ field: 'email', message: 'email not available' }],
			);
		}

		entity.password = encryptPassword(entity.password);
		const parsedEntity = this.removeForbiddenFields<IUser>(
			new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		const modEntity = this.updateAuthor<IUser>(parsedEntity, { creator: ctx.meta.user });
		const requireToken = () => {
			if (
				entity.hasOwnProperty('requireRegToken') &&
				typeof entity.requireRegToken === 'boolean'
			) {
				return entity.requireRegToken;
			} else {
				return JSON.parse(Config.registrationTokenRequired);
			}
		};
		const addVerificationToken = this.addVerificationToken(modEntity, requireToken());
		this.logger.debug('♻ Creating user');
		return await this._create(ctx, addVerificationToken);
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: get me
	 *      description: get me.
	 *      operationId: getMe
	 *      responses:
	 *        200:
	 *          description: Get me result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Get<RestOptions>('/', {
		name: 'getMe',
		restricted: ['api'],
		cache: getActionConfig.cache,
		params: {
			...getActionConfig.params,
			id: { type: 'string', optional: true },
		},
	})
	async getMe(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Attempting to get logged in user by id');
		return await this._get(ctx, { ...params, id: ctx.meta.user._id });
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: get user by id
	 *      description: get user by id.
	 *      operationId: getUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb71ba74676dfca3fef434f
	 *      responses:
	 *        200:
	 *          description: Get user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Get<RestOptions>('/:id', {
		name: 'get.id',
		restricted: ['api'],
		roles: UserRoleDefault.SUPERADMIN,
		...getActionConfig,
	})
	async getUser(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Attempting to find user by id');
		return await this._get(ctx, await { ...params, populate: ['createdBy', 'lastModifiedBy'] });
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    put:
	 *      tags:
	 *      - "Users"
	 *      summary: update a user
	 *      description: update a user.
	 *      operationId: updateUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb71ba74676dfca3fef434f
	 *      requestBody:
	 *        required: true
	 *        content:
	 *         application/json:
	 *            schema:
	 *              anyOf:
	 *              - $ref: '#/components/schemas/User'
	 *      responses:
	 *        200:
	 *          description: Update user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id', {
		name: 'update',
		restricted: ['api', 'user'],
		roles: UserRoleDefault.SUPERADMIN,
		params: {
			...validateUserBaseOptional,
			password: { type: 'string', optional: true },
			id: 'string',
		},
	})
	async updateUser(ctx: Context<UserUpdateParams, UserAuthMeta>) {
		const { id } = ctx.params;
		this.logger.debug('♻ Deleting param id');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete ctx.params.id;
		this.logger.debug('♻ Attempting to find if user to update by id');
		const user = (await this.adapter.findById(id)) as IUser;
		if (!user) {
			this.logger.error('♻ User to update not found');
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.NOT_FOUND,
				userErrorCode.NOT_FOUND,
			);
		}
		this.logger.debug('♻ Removing forbidden fields from found user');
		const parsedEntity = this.removeForbiddenFields<IUser>(
			new JsonConvert()
				.deserializeObject({ ...user, ...ctx.params }, UserEntity)
				.getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		this.logger.debug('♻ Updating modified by...');
		const newUser = this.updateAuthor(
			{
				...user,
				...parsedEntity,
				createdBy: user.createdBy,
				createdDate: user.createdDate,
			},
			{ modifier: ctx.meta.user },
		);
		const { password } = ctx.params;
		if (password) {
			this.logger.debug('♻ Encrypting password');
			newUser.password = encryptPassword(password);
		}
		this.logger.debug('♻ Updating user by id...');
		const result = await this.adapter.updateById(id, newUser);
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		return transform;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    delete:
	 *      tags:
	 *      - "Users"
	 *      summary: Delete user by id
	 *      description: Delete user by id.
	 *      operationId: deleteUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb725a7ada22e664c83e634
	 *      responses:
	 *        200:
	 *          description: Delete user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Delete<RestOptions>('/:id', {
		name: 'remove',
		restricted: ['api'],
		roles: UserRoleDefault.SUPERADMIN,
		params: { id: 'string' },
	})
	async deleteUser(ctx: Context<UserDeleteParams, UserAuthMeta>) {
		this.logger.debug('♻ Checking if user account to be deleted is self');
		if (ctx.params.id === ctx.meta.user._id) {
			this.logger.error('♻ Cannot delete own user account');
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DELETE_ITSELF,
				userErrorCode.DELETE_ITSELF,
			);
		}
		const params = await this.sanitizeParams(ctx, ctx.params);
		try {
			this.logger.debug('♻ Attempting to delete user...');
			let recordToDelete: IUser = (await this._get(ctx, { id: ctx.params.id })) as IUser;

			return await this._remove(ctx, params)
				.then(async (record) => {
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					await this.broker.emit(UserEvent.DELETED, { id: ctx.params.id });
					return { recordsDeleted: record, record: recordToDelete };
				})
				.catch((err) => this.logger.error('♻ User deletion error:', err));
		} catch (err) {
			this.logger.error('♻ Error deleting user: ', err);
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/removeMany:
	 *    post:
	 *      tags:
	 *      - "Users"
	 *      summary: Delete users
	 *      description: Delete multiple users
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - userIDs
	 *              type: object
	 *              properties:
	 *                userIDs:
	 *                  type: array
	 *                  description: user ids
	 *                  items:
	 *                    type: string
	 *                  example: ["5eb725a7ada22e664c83e634","5eb71c1e9662c4530b2e9d2a"]
	 *      responses:
	 *        200:
	 *          description: Delet users result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/removeMany', {
		name: 'removeMany',
		restricted: ['api'],
		roles: UserRoleDefault.SUPERADMIN,
		params: { userIDs: { type: 'array', items: 'string' } },
	})
	async deleteManyUsers(ctx: Context<UsersDeleteParams, UserAuthMeta>) {
		try {
			const isArray = ctx.params.userIDs;
			let recordsToDelete: any[] = [];
			let deletionErrors: any[] = [];
			this.logger.debug('♻ Checking that more than one id is in array...');
			if (Array.isArray(isArray) && isArray.length > 1) {
				let recordsCount = 0;
				let recordErrors = 0;
				const deleteSelfError = async (id: any) => {
					this.logger.error(
						'♻ User id array contains id of current user, cannot delete self',
					);
					deletionErrors.push({
						error: {
							message: 'Cannot delete self',
							code: userErrorCode.DELETE_ITSELF,
							type: userErrorMessage.DELETE_ITSELF,
						},
						record: await this._get(ctx, { id: id }),
					});
					recordErrors++;
				};
				for (const element of isArray) {
					element === ctx.meta.user._id
						? deleteSelfError(element)
						: await this._get(ctx, { id: element })
								.then(async (userRecord) => {
									recordsToDelete.push(userRecord);
									this.logger.debug('♻ Deleting users in array: ', isArray);
									await this._remove(ctx, { id: element });
									recordsCount++;
								})
								.catch(async (err) => {
									this.logger.error('♻ Error deleting user: ', element);
									deletionErrors.push({
										error: err,
										record: {
											id: element,
										},
									});
									recordErrors++;
								});
				}

				return deletionErrors.length > 0
					? {
							recordsDeleted: {
								deletionCount: recordsCount,
								deletedRecords: recordsToDelete,
							},
							deletionErrors: { errorCount: recordErrors, records: deletionErrors },
					  }
					: {
							recordsDeleted: {
								deletionCount: recordsCount,
								deletedRecords: recordsToDelete,
							},
					  };
			}

			if (Array.isArray(isArray) && isArray.length === 1) {
				this.logger.warn(
					`♻ Deletion skipped. API removemany called with 1 item in array. Use DELETE /api/v${this.version}/user/:id instead.`,
				);
				return {
					code: userErrorCode.WRONG,
					message: `Deletion skipped. API removemany called with 1 item in array. Use DELETE /api/v${this.version}/user/:id instead.`,
				};
			}
			if (!Array.isArray(isArray) || (Array.isArray(isArray) && isArray.length) < 1) {
				this.logger.error(`♻ API removemany called with unprocessable parameter array`);
				return {
					code: userErrorCode.WRONG,
					message: 'API removemany called with unprocessable parameter',
				};
			}
		} catch (err) {
			this.logger.error('♻ API removemany error: ', err);
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/list:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: list all users
	 *      description: list all users.
	 *      operationId: listAllUsers
	 *      responses:
	 *        200:
	 *          description: Get user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                type: object
	 *                properties:
	 *                  rows:
	 *                    type: array
	 *                    items:
	 *                      allOf:
	 *                      - type: object
	 *                        properties:
	 *                          _id:
	 *                            type: string
	 *                      - $ref: '#/components/schemas/User'
	 *                  total:
	 *                    type: number
	 *                    description: Users result count
	 *                  page:
	 *                    type: number
	 *                    description: Users result page
	 *                  pageSize:
	 *                    type: number
	 *                    description: Users result page size max
	 *                  totalPages:
	 *                    type: number
	 *                    description: Users result total pages
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		restricted: ['api'],
		roles: UserRoleDefault.SUPERADMIN,
		...listActionConfig,
	})
	async listAllUsers(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Listing users...');
		const userList = await this._list(ctx, await { ...params });
		return userList;
	}

	@Method
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private addVerificationToken(user: IUser, requireToken: boolean) {
		let result = { ...user } as IUser;
		if (requireToken) {
			this.logger.debug('♻ Adding verification token');
			result = { ...result, verificationToken: randomstring.generate(64) };
		} else {
			this.logger.debug('♻ Setting user to active');
			result.active = true;
		}
		return result;
	}
}
