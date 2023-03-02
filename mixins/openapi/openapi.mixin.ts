/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { existsSync, writeFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import _, { isEqual } from 'lodash';
// import swaggerJSDoc from 'swagger-jsdoc';
// import * as pkg from '../../package.json';
import { Config } from '../../common';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
// import { swComponents, swSecurity } from '../swComponents';
import { generateOpenAPISchema } from '@ServiceHelpers/openAPISchema.helper';
// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerServerError = Errors.MoleculerServerError;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

export const openAPIMixin = (mixinOptions?: any) => {
	mixinOptions = _.defaultsDeep(mixinOptions, {
		routeOptions: {
			path: '/openapi',
		},
		schema: null,
	});

	return {
		methods: {
			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema,
			/* generateOpenAPISchema(): any {
				try {
					const swaggerDefinition = {
						openapi: '3.0.1',
						info: {
							title: `${pkg.name} API Documentation`, // Title of the documentation
							description:
								// eslint-disable-next-line max-len
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // Short description of the app
							version: pkg.version, // Version of the app
						},
						servers: [
							{
								url: `//${Config.SWAGGER_HOST}:${Config.SWAGGER_PORT}`, // base url to server
							},
						],
						components: swComponents,
						security: swSecurity,
					};
					// Options for the swagger docs
					const options = {
						// Import swaggerDefinitions
						definition: swaggerDefinition,
						explorer: true,
						enableCORS: false,

						// Path to the API docs
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						apis: JSON.parse(Config.SWAGGER_APIS),
					};
					// Initialize swagger-jsdoc
					const swaggerSpec = swaggerJSDoc(options);

					return swaggerSpec;
				} catch (err) {
					throw new MoleculerServerError(
						'Unable to compile OpenAPI schema',
						500,
						'UNABLE_COMPILE_OPENAPI_SCHEMA',
						{ err },
					);
				}
			}, */
		},

		async created() {
			const pathToSwaggerUi = `${SwaggerUI.absolutePath()}/swagger-initializer.js`;
			const options = {
				encoding: 'utf8',
				files: pathToSwaggerUi,
				from: [
					/(?:(?:https?|undefined):(\/\/|undefined?)|www\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim,
					/StandaloneLayout/g,
				],
				to: [`${Config.BASE_URL}:${Config.BASE_PORT}/openapi/swagger.json`, 'BaseLayout'],
			};
			try {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.logger.debug(
					`♻ Testing for matches to modify in swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
				);
				const dryRun = replaceInFile({ dry: true, countMatches: true, ...options });
				dryRun
					.then((results) => {
						if (results[0]['hasChanged'] == true) {
							// @ts-ignore
							this.logger.debug(
								`♻ Found matches in swagger initalize, updating file...`,
							);
							replaceInFile(options)
								.then(
									// @ts-ignore
									this.logger.debug(
										`♻ Updated swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
									),
								)
								.catch((err) =>
									// @ts-ignore
									this.logger.error(
										`♻ Error updating swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js: ${err}`,
									),
								);
						} else {
							// @ts-ignore
							this.logger.debug(
								'♻ No changes needed, swagger initialize has the correct values',
							);
						}
					})
					.catch((err) => {
						// @ts-ignore
						this.logger.error(`♻ Error testing for matches: ${err}`);
						throw new MoleculerServerError(
							'♻ Error testing for matches in swagger-initializer.js',
							500,
							'ERROR_TESTING_MATCHES',
							{ err },
						);
					});
			} catch (err) {
				throw new MoleculerServerError(
					'♻ unable to update swagger-initializer.js',
					500,
					'UNABLE_EDIT_SWAGGER_INITIALIZER',
					{ err },
				);
			}

			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [ApiGateway.serveStatic(SwaggerUI.absolutePath())],
				// rate lime for swagger api doc route
				rateLimit: {
					// How long to keep record of requests in memory (in milliseconds).
					// Defaults to 60000 (1 min)
					window: 60 * 1000,

					// Max number of requests during window. Defaults to 30
					limit: 5,

					// Set rate limit headers to response. Defaults to false
					headers: true,

					// Function used to generate keys. Defaults to:
					key: (req: RequestMessage) => {
						return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
					},
					//StoreFactory: CustomStore
				},

				aliases: {
					'GET /swagger.json'(req: any, res: any): void {
						try {
							const ctx = req.$ctx;
							ctx.meta.responseType = 'application/json';
							const swJSONFile = existsSync('./swagger.json');
							// @ts-ignore
							const generatedScheme = this.generateOpenAPISchema();
							if (!swJSONFile) {
								// @ts-ignore
								this.logger.warn('♻ No Swagger JSOn file found, creating it.');
								writeFileSync(
									'./swagger.json',
									JSON.stringify(generatedScheme, null, 4),
									'utf8',
								);
								// @ts-ignore
								return this.sendResponse(req, res, generatedScheme);
							} else {
								const swJSON = require('../../swagger.json');
								// @ts-ignore
								this.logger.debug(
									'♻ Checking if Swagger JSON schema needs updating...',
								);
								if (isEqual(swJSON, generatedScheme)) {
									// @ts-ignore
									this.logger.debug(
										'♻ No changes needed, swagger json schema has the correct values',
									);
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									return this.sendResponse(req, res, generatedScheme);
								} else {
									// @ts-ignore
									this.logger.debug(
										'♻ Swagger JSON schema needs updating, updating file...',
									);
									writeFileSync(
										'./swagger.json',
										JSON.stringify(generatedScheme, null, 4),
										'utf8',
									);
									// @ts-ignore
									this.logger.debug(`♻ Updated swagger JSON`);
									// @ts-ignore
									return this.sendResponse(req, res, generatedScheme);
									// return req.end(generatedScheme);
								}
							}
						} catch (err) {
							throw new MoleculerServerError(
								'♻ Error updating swagger JSON schema',
								500,
								'UNABLE_UPDATE_SWAGGER_JSON',
								{ err },
							);
						}
					},
				},

				mappingPolicy: 'restrict',
			});

			// Add route
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.settings.routes.unshift(route);
		},

		async started() {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.logger.debug(
				`♻ OpenAPI swagger Docs server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};
