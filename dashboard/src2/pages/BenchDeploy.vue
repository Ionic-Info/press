<template>
	<div class="p-5" v-if="deploy">
		<div>
			<div class="flex items-center space-x-2">
				<h2 class="text-lg font-medium text-gray-900">{{ deploy.name }}</h2>
				<Badge :label="deploy.status" />
			</div>
			<div>
				<div class="mt-4 grid grid-cols-5 gap-4">
					<div>
						<div class="text-sm font-medium text-gray-500">Creation</div>
						<div class="mt-2 text-sm text-gray-900">
							{{ $dayjs(deploy.creation).toLocaleString() }}
						</div>
					</div>
					<div>
						<div class="text-sm font-medium text-gray-500">Creator</div>
						<div class="mt-2 text-sm text-gray-900">
							{{ deploy.owner }}
						</div>
					</div>
					<div>
						<div class="text-sm font-medium text-gray-500">Duration</div>
						<div class="mt-2 text-sm text-gray-900">
							{{ formatDuration(deploy.build_duration) }}
						</div>
					</div>
					<div>
						<div class="text-sm font-medium text-gray-500">Start</div>
						<div class="mt-2 text-sm text-gray-900">
							{{ $dayjs(deploy.build_start).toLocaleString() }}
						</div>
					</div>
					<div>
						<div class="text-sm font-medium text-gray-500">End</div>
						<div class="mt-2 text-sm text-gray-900">
							{{ $dayjs(deploy.build_end).toLocaleString() }}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-8 space-y-4">
			<JobStep
				v-for="step in deploy.build_steps"
				:step="step"
				:key="step.name"
			/>
		</div>
	</div>
</template>
<script>
import { formatDuration } from '../utils/format';

export default {
	name: 'BenchDeploy',
	props: ['id'],
	resources: {
		deploy() {
			return {
				type: 'document',
				doctype: 'Deploy Candidate',
				name: this.id,
				transform(deploy) {
					for (let step of deploy.build_steps) {
						step.isOpen = false;
						step.title = `${step.stage} - ${step.step}`;
						step.output =
							step.command || step.output
								? `${step.command || ''}\n${step.output || ''}`.trim()
								: '';
						step.duration = ['Success', 'Failure'].includes(step.status)
							? step.cached
								? 'Cached'
								: `${step.duration}s`
							: null;
					}
					return deploy;
				}
			};
		}
	},
	computed: {
		deploy() {
			return this.$resources.deploy.doc;
		}
	},
	methods: {
		formatDuration
	}
};
</script>
