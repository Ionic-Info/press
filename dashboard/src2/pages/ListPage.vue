<template>
	<div class="flex h-full flex-col">
		<div class="sticky top-0 z-10 shrink-0">
			<Header>
				<Breadcrumbs
					:items="[{ label: object.list.title, route: object.list.route }]"
				/>
				<!-- <Button>Actions</Button> -->
			</Header>
		</div>
		<div class="p-5">
			<ObjectList :options="listOptions" />
		</div>
	</div>
</template>

<script>
import { Breadcrumbs, Button, Dropdown, TextInput } from 'frappe-ui';

export default {
	components: {
		Breadcrumbs,
		Button,
		Dropdown,
		TextInput
	},
	props: {
		object: {
			type: Object,
			required: true
		}
	},
	methods: {
		getRoute(row) {
			return {
				name: `${this.object.doctype} Detail`,
				params: {
					name: row.name
				}
			};
		}
	},
	computed: {
		listOptions() {
			return {
				...this.object.list,
				doctype: this.object.doctype,
				route: this.getRoute
			};
		}
	}
};
</script>
