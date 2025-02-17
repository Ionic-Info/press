import { defineAsyncComponent, h } from 'vue';
import { FeatherIcon, frappeRequest } from 'frappe-ui';
import { toast } from 'vue-sonner';
import { formatBytes, formatDuration } from '../utils/format';
import dayjs from '../utils/dayjs';
import AddDomainDialog from '../components/AddDomainDialog.vue';
import GenericDialog from '../components/GenericDialog.vue';
import ObjectList from '../components/ObjectList.vue';

export default {
	doctype: 'Site',
	whitelistedMethods: {
		activate: 'activate',
		addDomain: 'add_domain',
		archive: 'archive',
		backup: 'backup',
		clearSiteCache: 'clear_site_cache',
		deactivate: 'deactivate',
		disableDatabaseAccess: 'disable_database_access',
		disableReadWrite: 'disable_read_write',
		enableDatabaseAccess: 'enable_database_access',
		enableReadWrite: 'enable_read_write',
		getDatabaseCredentials: 'get_database_credentials',
		installApp: 'install_app',
		migrate: 'migrate',
		moveToBench: 'move_to_bench',
		moveToGroup: 'move_to_group',
		reinstall: 'reinstall',
		removeDomain: 'remove_domain',
		resetSiteUsage: 'reset_site_usage',
		restoreSite: 'restore_site',
		restoreTables: 'restore_tables',
		retryArchive: 'retry_archive',
		retryRename: 'retry_rename',
		scheduleUpdate: 'schedule_update',
		suspend: 'suspend',
		sync_info: 'sync_info',
		unsuspend: 'unsuspend',
		updateSiteConfig: 'update_site_config',
		updateWithoutBackup: 'update_without_backup'
	},
	list: {
		route: '/sites',
		title: 'Sites',
		fields: [
			'plan.plan_title as plan_title',
			'group.title as group_title',
			'group.version as version',
			'cluster.image as cluster_image',
			'cluster.title as cluster_title'
		],
		columns: [
			{ label: 'Site', fieldname: 'name', width: 2 },
			{ label: 'Status', fieldname: 'status', type: 'Badge', width: 1 },
			{
				label: 'Plan',
				fieldname: 'plan',
				width: 1,
				format(value, row) {
					return row.plan_title || value;
				}
			},
			{
				label: 'Cluster',
				fieldname: 'cluster',
				width: 1,
				format(value, row) {
					return row.cluster_title || value;
				},
				prefix(row) {
					return h('img', {
						src: row.cluster_image,
						class: 'w-4 h-4',
						alt: row.cluster_title
					});
				}
			},
			{
				label: 'Bench',
				fieldname: 'group',
				width: 1,
				format(value, row) {
					return row.group_title || value;
				}
			},
			{
				label: 'Version',
				fieldname: 'version',
				width: 1,
				class: 'text-gray-600'
			}
		],
		primaryAction({ listResource: sites }) {
			return {
				label: 'New Site',
				icon: 'plus',
				onClick() {
					let NewSiteDialog = defineAsyncComponent(() =>
						import('../components/NewSiteDialog.vue')
					);
					return h(NewSiteDialog);
				}
			};
		}
	},
	detail: {
		titleField: 'name',
		route: '/sites/:name',
		tabs: [
			{
				label: 'Analytics',
				icon: () => h(FeatherIcon, { name: 'bar-chart-2' }),
				route: 'analytics',
				type: 'Component',
				component: defineAsyncComponent(() =>
					import('../../src/views/site/SiteCharts.vue')
				),
				props: site => {
					return { site: site.doc };
				}
			},
			{
				label: 'Apps',
				icon: () => h(FeatherIcon, { name: 'grid' }),
				route: 'apps',
				type: 'list',
				list: {
					url: 'press.api.site.installed_apps',
					doctype: 'Site App',
					filters: site => {
						return { site: site.doc.name };
					},
					columns: [
						{
							label: 'App',
							fieldname: 'app',
							width: '12rem'
						},
						{
							label: 'Branch',
							fieldname: 'branch',
							type: 'Badge',
							width: '12rem'
						},
						{
							label: 'Commit',
							fieldname: 'hash',
							type: 'Badge',
							width: '12rem',
							format(value) {
								return value.slice(0, 7);
							}
						},
						{
							label: 'Commit Message',
							fieldname: 'commit_message'
						}
					],
					resource({ documentResource: site }) {
						return {
							type: 'list',
							doctype: 'Site App',
							cache: ['ObjectList', 'Site App'],
							fields: ['name', 'app'],
							parent: 'Site',
							filters: {
								parenttype: 'Site',
								parent: site.doc.name
							},
							auto: true
						};
					},
					primaryAction({ listResource: apps, documentResource: site }) {
						return {
							label: 'Install App',
							icon: 'plus',
							onClick() {
								return h(
									GenericDialog,
									{
										options: {
											title: 'Install app on your site',
											size: '4xl'
										}
									},
									{
										default: () =>
											h(ObjectList, {
												options: {
													label: 'App',
													fieldname: 'app',
													fieldtype: 'ListSelection',
													columns: [
														{
															label: 'Title',
															fieldname: 'title',
															class: 'font-medium',
															width: 2
														},
														{
															label: 'Repo',
															fieldname: 'repository_owner',
															class: 'text-gray-600'
														},
														{
															label: 'Branch',
															fieldname: 'branch',
															class: 'text-gray-600'
														},
														{
															label: '',
															fieldname: '',
															align: 'right',
															type: 'Button',
															width: '5rem',
															Button(row) {
																return {
																	label: 'Install',
																	onClick() {
																		if (site.installApp.loading) return;
																		toast.promise(
																			site.installApp.submit({
																				app: row.name
																			}),
																			{
																				loading: 'Installing app...',
																				success: () =>
																					'App will be installed shortly',
																				error: e => {
																					return e.messages.length
																						? e.messages.join('\n')
																						: e.message;
																				}
																			}
																		);
																	}
																};
															}
														}
													],
													resource() {
														return {
															url: 'press.api.site.available_apps',
															params: {
																name: site.doc.name
															},
															auto: true
														};
													}
												}
											})
									}
								);
							}
						};
					}
				}
			},
			{
				label: 'Domains',
				icon: () => h(FeatherIcon, { name: 'external-link' }),
				route: 'domains',
				type: 'list',
				list: {
					doctype: 'Site Domain',
					filters: site => {
						return { site: site.doc.name };
					},
					columns: [
						{
							label: 'Domain',
							fieldname: 'domain'
						},
						{
							label: 'Status',
							fieldname: 'status',
							type: 'Badge'
						},
						{
							label: 'Primary',
							fieldname: 'primary',
							type: 'Icon',
							Icon(value) {
								return value ? 'check' : '';
							}
						},
						{
							label: 'DNS Type',
							fieldname: 'dns_type',
							type: 'Badge'
						}
					],
					primaryAction({ listResource: domains, documentResource: site }) {
						return {
							label: 'Add Domain',
							icon: 'plus',
							onClick() {
								return h(AddDomainDialog, {
									site: site.doc,
									onDomainAdded() {
										domains.reload();
									}
								});
							}
						};
					},
					rowActions({ row, listResource: domains, documentResource: site }) {
						if (row.domain === site.doc.name) return;
						return [
							{
								label: 'Remove',
								onClick() {
									if (site.removeDomain.loading) return;
									toast.promise(
										site.removeDomain.submit({
											domain: row.domain
										}),
										{
											loading: 'Removing domain...',
											success: () => 'Domain removed',
											error: e => {
												return e.messages.length
													? e.messages.join('\n')
													: e.message;
											}
										}
									);
								}
							}
						];
					}
				}
			},
			{
				label: 'Backups',
				icon: () => h(FeatherIcon, { name: 'archive' }),
				route: 'backups',
				type: 'list',
				list: {
					doctype: 'Site Backup',
					filters: site => {
						return {
							site: site.doc.name,
							files_availability: 'Available',
							status: ['in', ['Pending', 'Running', 'Success']]
						};
					},
					orderBy: 'creation desc',
					fields: [
						'status',
						'database_url',
						'public_url',
						'private_url',
						'config_file_url',
						'site'
					],
					columns: [
						{
							label: 'Timestamp',
							fieldname: 'creation',
							width: 0.8,
							format(value) {
								let timestamp = new Date(value);
								return `Backup on ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}`;
							}
						},

						{
							label: 'Database',
							fieldname: 'database_size',
							width: 0.5,
							format(value) {
								return value ? formatBytes(value) : '';
							}
						},
						{
							label: 'Public Files',
							fieldname: 'public_size',
							width: 0.5,
							format(value) {
								return value ? formatBytes(value) : '';
							}
						},
						{
							label: 'Private Files',
							fieldname: 'private_size',
							width: 0.5,
							format(value) {
								return value ? formatBytes(value) : '';
							}
						},
						{
							label: 'Backup with files',
							fieldname: 'with_files',
							type: 'Icon',
							width: 0.5,
							Icon(value) {
								return value ? 'check' : '';
							}
						},
						{
							label: 'Offsite Backup',
							fieldname: 'offsite',
							width: 0.5,
							type: 'Icon',
							Icon(value) {
								return value ? 'check' : '';
							}
						}
					],
					rowActions({ row }) {
						if (row.status != 'Success') return;

						async function downloadBackup(backup, file) {
							// file: database, public, or private
							let link = backup.offsite
								? await frappeRequest('press.api.site.get_backup_link', {
										name: backup.site,
										backup: backup.name,
										file
								  })
								: backup[file + '_url'];
							window.open(link);
						}

						return [
							{
								label: 'Download Database',
								onClick() {
									return downloadBackup(row, 'database');
								}
							},
							{
								label: 'Download Public',
								onClick() {
									return downloadBackup(row, 'public');
								}
							},
							{
								label: 'Download Private',
								onClick() {
									return downloadBackup(row, 'private');
								}
							},
							{
								label: 'Download Config',
								onClick() {
									return downloadBackup(row, 'config_file');
								}
							}
						];
					},
					primaryAction({ listResource: backups, documentResource: site }) {
						return {
							label: 'Schedule Backup',
							loading: backups.insert.loading,
							onClick() {
								return backups.insert.submit(
									{
										site: site.doc.name
									},
									{
										onError(e) {
											let messages = e.messages || ['Something went wrong'];
											for (let message of messages) {
												toast.error(message);
											}
										},
										onSuccess() {
											toast.success('Backup scheduled');
										}
									}
								);
							}
						};
					}
				}
			},
			{
				label: 'Activity',
				icon: () => h(FeatherIcon, { name: 'activity' }),
				route: 'activity',
				type: 'list',
				list: {
					doctype: 'Site Activity',
					filters: site => {
						return { site: site.doc.name };
					},
					fields: ['owner'],
					orderBy: 'creation desc',
					columns: [
						{
							label: 'Action',
							fieldname: 'action',
							format(value, row) {
								let action = row.action;
								if (action == 'Create') {
									action = 'Site created';
								}
								return `${action} by ${row.owner}`;
							}
						},
						{
							label: 'Reason',
							fieldname: 'reason'
						},
						{
							label: '',
							fieldname: 'creation',
							type: 'Timestamp',
							align: 'right'
						}
					]
				}
			},
			{
				label: 'Jobs',
				icon: () => h(FeatherIcon, { name: 'truck' }),
				// highlight: route =>
				// 	['Site Detail Jobs', 'Site Job'].includes(route.name),
				route: 'jobs',
				type: 'list',
				list: {
					doctype: 'Agent Job',
					userFilters: {},
					filters: site => {
						return { site: site.doc.name };
					},
					route(row) {
						return {
							name: 'Site Job',
							params: { id: row.name, site: row.site }
						};
					},
					orderBy: 'creation desc',
					fields: ['site'],
					columns: [
						{
							label: 'Job Type',
							fieldname: 'job_type'
						},
						{
							label: 'Status',
							fieldname: 'status',
							type: 'Badge'
						},
						{
							label: 'Job ID',
							fieldname: 'job_id',
							class: 'text-gray-600'
						},
						{
							label: 'Duration',
							fieldname: 'duration',
							class: 'text-gray-600',
							format: formatDuration
						},
						{
							label: 'Start Time',
							fieldname: 'start',
							class: 'text-gray-600',
							format(value) {
								if (!value) return;
								return dayjs(value).format('DD/MM/YYYY HH:mm:ss');
							}
						},
						{
							label: 'End Time',
							fieldname: 'end',
							class: 'text-gray-600',
							format(value) {
								if (!value) return;
								return dayjs(value).format('DD/MM/YYYY HH:mm:ss');
							}
						}
					]
				}
			}
		]
	},
	routes: [
		{
			name: 'Site Job',
			path: 'job/:id',
			component: () => import('../pages/JobPage.vue')
		}
	]
};
