<template lang="pug">
div
	div.row.justify-center
		h3 Configuration
	div.row.items-start.justify-center.q-gutter-md
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Namespace
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Transporter
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Serializer
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Strategy
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Cacher
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Logger
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Metrics
			q-separator(dark inset)
			q-card-section 
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Tracing
			q-separator(dark inset)
			q-card-section 

	div.column.items-center.justify-evenly
		h3.cursor-pointer(@click="showBrokerOptions = !showBrokerOptions") Broker options
			q-icon(:name="'expand_' + (showBrokerOptions ? 'less' : 'more')")
		q-slide-transition
			div(v-show="showBrokerOptions").broker-options
				pre
					q-card
						q-card-section 
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { _ } from '../boot/lodash';
import { useQuasar } from 'quasar';

export default defineComponent({
	name: 'BrokerComponent',

});
</script>

<style lang="sass" scoped>
.my-card
	width: 100%
	max-width: 200px

pre.broker-options
	display: inline-block
	text-align: left
	font-size: 0.9em
</style>
