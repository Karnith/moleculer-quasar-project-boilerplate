/**
 * Main configuration class that provides all configuration values
 * to the application.
 */
import os from 'os';
import dotenvFlow from 'dotenv-flow';
import _ from 'lodash';
import { DBDialog, DBInfo } from '../types';

const processEnv = process.env;
const envVariables = Object.keys(
	dotenvFlow.parse(['./env/.env', `./env/.env.${process.env.NODE_ENV}`, './env/envIncludes.env']),
);
const configObj = _.pick(processEnv, envVariables);

// const isTrue = (text?: string | number) => [1, true, '1', 'true', 'yes'].includes(text || '');

// const isFalse = (text?: string | number) => [0, false, '0', 'false', 'no'].includes(text || '');

/* const getValue = (text?: string, defaultValud?: string | boolean) => {
	const vtrue = isTrue(text);
	const vfalse = isFalse(text);
	const val = text || defaultValud;
	if (vtrue) {
		return true;
	} else if (vfalse) {
		return false;
	}
	return val;
}; */

const HOST_NAME = os.hostname().toLowerCase();

const getDbInfo = (db: string, what: string, defaultValue?: string) => {
	try {
		const value = process.env[`DB_${db}_${what}`];
		const generic = process.env[`DB_GENERIC_${what}`];
		return value || generic || defaultValue;
	} catch (err) {
		console.log(`getDBInfo error ${db || what}: `, err);
		return;
	}
};

const genericDbInfo = (db: string): DBInfo => ({
	dialect: getDbInfo(db, 'DIALECT', 'local') as DBDialog,
	user: getDbInfo(db, 'USER')!,
	password: getDbInfo(db, 'PASSWORD')!,
	host: getDbInfo(db, 'HOST')!,
	port: +getDbInfo(db, 'PORT', '0')!,
	dbname: getDbInfo(db, 'DBNAME')!,
	collection: getDbInfo(db, 'COLLECTION', db.toLowerCase())!,
});

export default class ConfigClass {
	// Dynamic property key
	[index: string]: any;
	public static NODE_ENV: string;
	public static NODEID: string;

	public constructor() {
		// construct dynamic property keys
		Object.keys(configObj).forEach((key: string) => {
			/**
			 * add DB_ prefix to all DB_*_COLLECTION key values and add as new property
			 * else add new property from key with value from configObj
			 * */
			key.includes('COLLECTION')
				? (this[`DB_${key.split('_')[1].toLocaleUpperCase()}`] = genericDbInfo(
						configObj[key]!.toLocaleUpperCase(),
				  ))
				: (this[key.toUpperCase()] = configObj[key]);
		});
		this.NODE_ENV = process.env.NODE_ENV;
		this.NODEID = `${process.env.NODEID ? process.env.NODEID + '-' : ''}${HOST_NAME}-${
			this.NODE_ENV
		}`;
	}
}
