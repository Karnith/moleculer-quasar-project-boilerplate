<template lang="pug">
div.q-pa-md
	q-table(title="Node Status" :rows="nodes" :columns="columns" row-key="name")
		template(#header="props")
			q-tr(:props="props")
				q-th(v-for="col in props.cols" :key="col.name" :props="props") 
		template(#body="props")
			q-tr(:props="props")
				q-td(key="id" :props="props") 
				q-td(key="type" :props="props") 
				q-td(key="version" :props="props")
					q-badge(v-if="props.row.client.version" transparent color="black") 
				q-td(key="ip" :props="props") 
				q-td(key="hostname" :props="props") 
				q-td(key="status" :props="props")
					q-chip(
						class="glossy"
						square
						:color="props.row.available ? 'teal' : 'red'"
						text-color="white"
						:icon="props.row.available ? 'done' : 'priority_high'"
					) 
				q-td(key="cpu" :props="props") 
					div.bar(
						:style="{ width: props.row.cpu != null ? props.row.cpu + '%' : '0', backgroundColor: props.row.cpu >= '60' ? 'rgba(207,0,15,0.6)' : 'rgba(0,0,0,0.3)' }"
					)
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineComponent, ref, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQuasar } from 'quasar';
const columns = [
	{
		name: 'id',
		required: true,
		label: 'Node ID',
		align: 'left',
		field: (row: Record<string, unknown>) => row.id,
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		format: (val: unknown) => `${val}`,
		sortable: true,
	},
	{
		name: 'type',
		align: 'center',
		label: 'Type',
		field: 'client.type',
		sortable: true,
	},
	{
		name: 'version',
		align: 'center',
		label: 'Version',
		field: 'client.version',
		sortable: true,
	},
	{
		name: 'ip',
		align: 'center',
		label: 'IP',
		field: 'ipList',
		sortable: true,
	},
	{
		name: 'hostname',
		align: 'center',
		label: 'Hostname',
		field: 'hostname',
		sortable: true,
	},
	{
		name: 'status',
		align: 'center',
		label: 'Status',
		field: 'available',
		sortable: true,
	},
	{
		name: 'cpu',
		align: 'center',
		label: 'CPU',
		field: 'cpu',
		sortable: true,
	},
];

export default defineComponent({
	name: 'NodesComponent',

});
</script>

<style lang="sass" scoped>
.bar
	position: absolute
	left: 0
	right: 0
	top: 0
	bottom: 0
	width: 0
	height: 100%
	background-color: rgba(0,0,0,0.3)
</style>
