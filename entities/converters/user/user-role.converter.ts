import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { UserRoleDefault } from '../../../types';

@JsonConverter
export class UserRoleConverter implements JsonCustomConvert<UserRoleDefault[]> {
	public serialize(items: UserRoleDefault[]): string[] {
		return items.map((x) => x.toString());
	}

	public deserialize(items: string[]): UserRoleDefault[] {
		const values = Object.values<string>(UserRoleDefault);
		const valids = items.every((x) => values.includes(x));
		if (!valids) {
			throw new Error(`Not valid enum in roles "${items.join('", "')}"`);
		}
		return items.map<UserRoleDefault>((x) => x as UserRoleDefault);
	}
}
