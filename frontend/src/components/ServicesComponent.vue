<template>
	<q-table title="Service Status" :rows="filteredServices" :columns="columns" row-key="name">
		<template #header="props">
			<q-tr :props="props">
				<q-th auto-width />
				<q-th v-for="col in props.cols" :key="col.name" :props="props"></q-th>
			</q-tr>
		</template>

		<template #body="props">
			<q-tr :props="props">
				<q-td auto-width>
					<q-btn
						size="sm"
						color="accent"
						round
						dense
						@click="props.expand = !props.expand"
						:icon="props.expand ? 'remove' : 'add'"
					/>
				</q-td>

				<q-td key="name" :props="props">
					
					<q-badge v-if="props.row.version" transparent color="black"></q-badge>
				</q-td>

				<q-td key="nodes" :props="props">
					<q-chip
						v-for="nodeID in props.row.nodes"
						:key="nodeID"
						class="glossy"
						square
						color="grey"
						text-color="white"
						></q-chip
					>
				</q-td>

				<q-td key="status" :props="props">
					<q-chip
						class="glossy"
						square
						:color="props.row.nodes.length > 0 ? 'teal' : 'red'"
						text-color="white"
						:icon="props.row.nodes.length > 0 ? 'done' : 'priority_high'"
						></q-chip
					>
				</q-td>
			</q-tr>
			<q-tr v-show="props.expand" :props="props">
				<q-td colspan="100%">
					<q-markup-table>
						<thead>
							<tr>
								<th class="text-left">Action Name</th>
								<th class="text-center">Rest</th>
								<th class="text-center">Paramaters</th>
								<th class="text-right"></th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="action in getServiceActions(props.row)"
								:class="{
									action: true,
									offline: !action.available,
									local: action.hasLocal,
								}"
								:key="action.name"
							>
								<td>
									
									<q-badge
										v-if="action.action.cache"
										transparent
										color="orange"
										text-color="black"
										>cached</q-badge
									>
								</td>
								<td v-html="getActionREST(props.row, action)"></td>
								<td :title="getActionParams(action, 40)">
									
								</td>
								<td></td>
								<td>
									<q-chip
										class="glossy"
										square
										:color="action.available ? 'teal' : 'red'"
										text-color="white"
										:icon="action.available ? 'done' : 'priority_high'"
										></q-chip
									>
								</td>
							</tr>
						</tbody>
					</q-markup-table>
				</q-td>
			</q-tr>
		</template>
	</q-table>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineComponent, ref, computed, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQuasar } from 'quasar';

let interval: unknown = undefined;

const columns = [
	{
		name: 'name',
		required: true,
		label: 'Service name',
		align: 'left',
		field: (row: Record<string, unknown>) => row.name,
		format: (val: unknown) => `${val}`,
		sortable: true,
	},
	{
		name: 'nodes',
		align: 'center',
		label: 'Instances',
		field: 'nodes',
		sortable: true,
	},
	{
		name: 'status',
		align: 'center',
		label: 'Status',
		field: 'nodes',
		sortable: true,
	},
];

export default defineComponent({
	name: 'ServicesComponent',

});
</script>

<style lang="sass" scoped></style>
