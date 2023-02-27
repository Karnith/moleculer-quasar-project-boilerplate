/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import moleculer, { Context } from 'moleculer';
import { Put, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbRolesMixin, eventsRolesMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import {
	IUserRole,
	RestOptions,
	roleErrorCode,
	roleErrorMessage,
	RoleServiceSettingsOptions,
	RolesManipulateValueParams,
	RolesServiceOptions,
	UserAuthMeta,
	// UserJWT,
} from '../../types';
import { JsonConvert } from 'json2typescript';
import { /* IUser, */ RolesEntity } from 'entities';
import { BaseServiceWithDB } from '../../factories';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service<RolesServiceOptions>({
	name: 'roles',
	version: 1,
	mergeActions: true,
	/**
	 * Service guard token
	 */
	authToken: Config.ROLES_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [dbRolesMixin, eventsRolesMixin],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: [
			'_id',
			'role',
			'value',
			'langKey',
			'active',
			'createdBy',
			'createdDate',
			'lastModifiedBy',
			'lastModifiedDate',
			'systemLocked',
		],
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
		// Base path
		rest: '/',
		// user jwt secret
		JWT_SECRET: Config.JWT_SECRET,
		entityValidator: {
			role: 'string|min:3',
			value: 'string',
			active: 'boolean',
			systemLocked: 'boolean',
		},
	},
	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the active field to false.
			 *
			 * @param {Context} ctx
			 */
			create: (ctx: Context<{ active: boolean }>) => {
				ctx.params.active = false;
			},
		},
	},
	/* actions: {
		list: false,
	}, */
})
export default class RolesService extends BaseServiceWithDB<RoleServiceSettingsOptions, IUserRole> {
	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}/activate:
	 *    put:
	 *      tags:
	 *      - "Roles"
	 *      summary: Activate role
	 *      description: Activate or deactivate a role by id.
	 *      operationId: activateRole
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json; charset=utf-8:
	 *            schema:
	 *              required:
	 *              - active
	 *              type: object
	 *              properties:
	 *                active:
	 *                  type: boolean
	 *                  description: Set to active or inactive
	 *      responses:
	 *        200:
	 *          description: Activate role result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id/activate', {
		name: 'activateRole',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			// Id: 'string',
			id: 'string',
			active: {
				type: 'boolean',
				optional: false,
			},
		},
	})
	async activateRole(ctx: Context<RolesManipulateValueParams, UserAuthMeta>) {
		const { id } = ctx.params;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete ctx.params.id;
		const role = (await this.adapter.findById(id)) as IUserRole;
		if (!role) {
			throw new moleculer.Errors.MoleculerClientError(
				roleErrorMessage.NOT_FOUND,
				roleErrorCode.NOT_FOUND,
			);
		}
		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert()
				.deserializeObject({ ...role, ...ctx.params }, RolesEntity)
				.getMongoEntity(),
		);
		const newRole = this.updateAuthor(
			{
				...role,
				...parsedEntity,
				createdBy: role.createdBy,
				createdDate: role.createdDate,
			},
			{ modifier: ctx.meta.user },
		);

		const result = await this.adapter.updateById(id, newRole);
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		return transform;
	}
	/**
	 * Loading sample data to the collection.
	 * It is called in the DB.mixin after the database
	 * connection establishing & the collection is empty.
	 */
	/* @Method
	async seedDB() {
		await this.adapter.insertMany([
			{ name: 'Samsung Galaxy S10 Plus', quantity: 10, price: 704 },
			{ name: 'iPhone 11 Pro', quantity: 25, price: 999 },
			{ name: 'Huawei P30 Pro', quantity: 15, price: 679 },
		]);
	} */

	/**
	 * Fired after database connection establishing.
	 */
	@Method
	async afterConnected() {
		// After db connection
	}

	/**
	 * The "moleculer-db" mixin registers the following actions:
	 *  - list
	 *  - find
	 *  - count
	 *  - create
	 *  - insert
	 *  - update
	 *  - remove
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles:
	 *    get:
	 *      tags:
	 *      - "Roles"
	 *      summary: Get all roles (auto generated)
	 *      description: Get all roles
	 *      responses:
	 *        200:
	 *          description: Roles result
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
	 *                      - $ref: '#/components/schemas/Roles'
	 *                  total:
	 *                    type: number
	 *                    description: Roles result count
	 *                  page:
	 *                    type: number
	 *                    description: Roles result page
	 *                  pageSize:
	 *                    type: number
	 *                    description: Roles result page size max
	 *                  totalPages:
	 *                    type: number
	 *                    description: Roles result total pages
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles:
	 *    post:
	 *      tags:
	 *      - "Roles"
	 *      summary: Create a role (auto generated)
	 *      description: Create a role
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - role
	 *              - value
	 *              type: object
	 *              properties:
	 *                role:
	 *                  type: string
	 *                  description: Name to be used
	 *                  example: role name
	 *                value:
	 *                  type: string
	 *                  description: Value of role
	 *                  example: Admin
	 *                langKey:
	 *                  type: string
	 *                  description: Language of role
	 *                  example: en-us
	 *                active:
	 *                  type: boolean
	 *                  description: Role active
	 *                  example: true
	 *                systemLocked:
	 *                  type: boolean
	 *                  description: Roles locked by system from deletion
	 *                  example: true
	 *      responses:
	 *        200:
	 *          description: Create role result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    get:
	 *      tags:
	 *      - "Roles"
	 *      summary: Get role by id (auto generated)
	 *      description: Get role by id
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      responses:
	 *        200:
	 *          description: Roles result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    put:
	 *      tags:
	 *      - "Roles"
	 *      summary: Update a role (auto generated)
	 *      description: Update role.
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              anyOf:
	 *              - $ref: '#/components/schemas/Roles'
	 *      responses:
	 *        200:
	 *          description: Roles update result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        403:
	 *          description: Server error
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    delete:
	 *      tags:
	 *      - "Roles"
	 *      summary: Delete a role (auto generated)
	 *      description: Delete role by id
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      responses:
	 *        200:
	 *          description: Delete result
	 *          content: {}
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */
}
