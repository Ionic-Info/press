<template>
	<div>
		<div class="flex justify-center">
			<LoadingText v-if="$resources.options.loading" />

			<div class="flex flex-col items-center gap-2">
				<ErrorMessage
					:message="
						$resources.options.error === 'Bad credentials'
							? 'Access token expired, reauthorization required'
							: $resources.options.error
					"
				/>

				<Button
					v-if="requiresReAuth"
					variant="solid"
					icon-left="github"
					@click="$resources.clearAccessToken.submit()"
					:loading="$resources.clearAccessToken.loading"
				>
					Reauthorize GitHub</Button
				>

				<ErrorMessage :message="$resources.clearAccessToken.error" />
			</div>

			<div v-if="needsAuthorization">
				<Button
					variant="solid"
					icon-left="github"
					:link="options.installation_url + '?state=' + state"
				>
					Connect To GitHub
				</Button>
			</div>
		</div>
		<div v-if="options">
			<div v-if="options.authorized && options.installations.length > 0">
				<div class="flex items-baseline justify-between border-b pb-1">
					<label class="text-lg font-semibold"> Select a repository </label>
					<span class="text-sm text-gray-600">
						Don't see your organization?
						<Link
							:href="options.installation_url + '?state=' + state"
							class="font-medium"
						>
							Add from GitHub
						</Link>
					</span>
				</div>
				<div class="mt-2">
					<NewAppRepositories
						:options="options"
						:repositoryResource="$resources.repository"
						v-model:selectedRepo="selectedRepo"
						v-model:selectedInstallation="selectedInstallation"
						v-model:selectedBranch="selectedBranch"
					/>
					<div
						v-if="$resources.validateApp.data"
						class="text-medium mt-4 text-base"
					>
						<div v-if="validatedApp" class="flex">
							<GreenCheckIcon class="mr-2 w-4" />
							Found {{ validatedApp.title }} ({{ validatedApp.name }})
						</div>
					</div>
				</div>
				<div>
					<ErrorMessage class="mb-2" :message="$resources.validateApp.error" />
					<Button
						class="mt-2"
						variant="solid"
						v-if="selectedRepo && selectedBranch && !validatedApp"
						@click="$resources.validateApp.submit()"
						:loading="$resources.validateApp.loading"
					>
						Validate App
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import NewAppRepositories from './NewAppRepositories.vue';

export default {
	name: 'SelectAppFromGithub',
	components: {
		NewAppRepositories
	},
	data() {
		return {
			selectedRepo: null,
			selectedInstallation: null,
			selectedBranch: null,
			requiresReAuth: false
		};
	},
	resources: {
		options() {
			return {
				url: 'press.api.github.options',
				auto: true,
				onError(message) {
					if (message === 'Bad credentials') {
						this.requiresReAuth = true;
					}
				}
			};
		},
		repository() {
			let auto = this.selectedInstallation && this.selectedRepo;
			let params = {
				installation: this.selectedInstallation?.id,
				owner: this.selectedInstallation?.login,
				name: this.selectedRepo?.name
			};

			return {
				url: 'press.api.github.repository',
				params,
				auto,
				onSuccess(repository) {
					this.selectedBranch = repository.default_branch;
				}
			};
		},
		validateApp() {
			let params = {
				installation: this.selectedInstallation?.id,
				owner: this.selectedInstallation?.login,
				repository: this.selectedRepo?.name,
				branch: this.selectedBranch
			};
			return {
				url: 'press.api.github.app',
				params,
				onSuccess(data) {
					if (data) {
						const app = {
							name: data.name,
							title: data.title,
							repository_url: this.selectedRepo?.url,
							branch: this.selectedBranch,
							github_installation_id: this.selectedInstallation?.id
						};
						this.$emit('onSelect', app);
					}
				},
				onError() {
					// Invalid Frappe App
					this.$emit('onSelect', null);
				}
			};
		},
		clearAccessToken() {
			return {
				url: 'press.api.github.clear_token_and_get_installation_url',
				onSuccess(installation_url) {
					window.location.href = installation_url + '?state=' + this.state;
				}
			};
		}
	},
	computed: {
		options() {
			return this.$resources.options.data;
		},
		needsAuthorization() {
			if (this.$resources.options.loading) return false;
			return (
				this.$resources.options.data &&
				(!this.$resources.options.data.authorized ||
					this.$resources.options.data.installations.length === 0)
			);
		},
		state() {
			let location = window.location.href;
			let state = { team: this.$account.team.name, url: location };
			return btoa(JSON.stringify(state));
		},
		validatedApp() {
			if (
				this.$resources.validateApp.loading ||
				!this.$resources.validateApp.data
			) {
				this.$emit('onSelect', null);
				return null;
			}
			if (
				this.$resources.validateApp.data &&
				this.$resources.validateApp.data.name
			) {
				return this.$resources.validateApp.data;
			}

			this.$emit('onSelect', null);
			return null;
		}
	}
};
</script>
