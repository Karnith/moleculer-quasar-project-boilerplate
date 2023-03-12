'use strict';

// process.env.TEST = 'true';

import { clearDB, testConfig } from '../../helpers/helper';
import { Config } from '../../../common';
import { Context, Errors, ServiceBroker } from 'moleculer';
import TestService from '../../../services/productService';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

describe("Test 'products' service", () => {
	let version: string;

	afterEach(async () => {
		await clearDB(Config.DB_PRODUCT);
	});

	describe('Unit tests for Products service', () => {
		const broker = new ServiceBroker(testConfig);
		/* const broker = new ServiceBroker({
			logger: false,
			metrics: false,
		}); */
		const service = broker.createService(TestService);

		version = `v${service.version}`;
		jest.spyOn(service.adapter, 'updateById');
		jest.spyOn(service, 'transformDocuments');
		jest.spyOn(service, 'entityChanged');

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());
		beforeEach(() => expect.hasAssertions());

		const record = {
			_id: '123',
			name: 'Awesome thing',
			price: 999,
			quantity: 25,
			createdAt: Date.now(),
		};

		describe(`Test '${version}.products.create'`, () => {
			it('should call the adapter create method', async () => {
				const res = await broker.call(`${version}.products.create`, {
					name: 'test product',
					price: 10,
				});
				expect(res)
					.toBeObject()
					.toContainEntries([
						['_id', expect.any(String)],
						['name', 'test product'],
						['price', 10],
						['quantity', 0],
					]);
			});
		});

		describe(`Test '${version}.products.increaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				service.adapter.updateById.mockImplementation(async () => record);
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

				const res = await broker.call(`${version}.products.increaseQuantity`, {
					id: '123',
					value: 10,
				});
				expect(res).toEqual({
					_id: '123',
					name: 'Awesome thing',
					price: 999,
					quantity: 25,
				});

				expect(service.adapter.updateById).toBeCalledTimes(1);
				expect(service.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: 10 },
				});

				expect(service.transformDocuments).toBeCalledTimes(1);
				expect(service.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(service.entityChanged).toBeCalledTimes(1);
				expect(service.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});
		});

		describe(`Test '${version}.products.decreaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				service.adapter.updateById.mockClear();
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

				const res = await broker.call(`${version}.products.decreaseQuantity`, {
					id: '123',
					value: 10,
				});
				expect(res).toEqual({
					_id: '123',
					name: 'Awesome thing',
					price: 999,
					quantity: 25,
				});

				expect(service.adapter.updateById).toBeCalledTimes(1);
				expect(service.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: -10 },
				});

				expect(service.transformDocuments).toBeCalledTimes(1);
				expect(service.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(service.entityChanged).toBeCalledTimes(1);
				expect(service.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});

			it('should throw error if params is not valid', async () => {
				service.adapter.updateById.mockClear();
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

				expect.assertions(2);
				try {
					await broker.call(`${version}.products.decreaseQuantity`, {
						id: '123',
						value: -5,
					});
				} catch (err) {
					expect(err).toBeInstanceOf(Errors.ValidationError);
					expect(err).toStrictEqual(
						expect.objectContaining({
							data: [
								{
									action: `${version}.products.decreaseQuantity`,
									actual: -5,
									field: 'value',
									message: "The 'value' field must be a positive number.",
									nodeID: broker.nodeID,
									type: 'numberPositive',
								},
							],
						}),
					);
				}
			});
		});
	});
});
