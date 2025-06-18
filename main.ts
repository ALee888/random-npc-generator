import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TextComponent, TFile, TFolder, Vault } from 'obsidian';
import { NPC } from './npc'
import { text } from 'stream/consumers';
// Remember to rename these classes and interfaces!

interface RandomNPCSettings {
	npcPath: string;
	properties: Record<string, string>;
}

const DEFAULT_SETTINGS: RandomNPCSettings = {
	npcPath: '',
	properties: {}
}

export default class MyPlugin extends Plugin {
	settings: RandomNPCSettings;
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Generate random NPC', async (evt: MouseEvent) => {
			// For each npc property get folder or results
			// const raceOptions = await this.getOptions(this.settings.racePath);
			const npcFile = await this.generateNPCFile();
			
			new Notice('Created new NPC: ' + npcFile?.basename);

		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: 'generate-new-npc',
			name: 'Generate new NPC',
			callback: async () => {
				this.generateNPCFile();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		console.log("settings saved");
		await this.saveData(this.settings);
	}

	async getAllFilesInFolder(folder: TFolder): Promise<TFile[]> {
		return new Promise((resolve) => {
			const files: TFile[] = [];
		
			Vault.recurseChildren(folder, (file) => {
				if (file instanceof TFile) {
					files.push(file);
				}
			});
			resolve(files);
		});
	}


	async getOptions(path: string) {
		let npcOptions: string [] = [];

		// Get the folder of file at the given path
		const abstractFile = this.app.vault.getAbstractFileByPath(path);
		
		if (abstractFile instanceof TFile) {
			console.log('It\'s a file at ', path);
			// TODO: Get each option from the given file
			// vault.cachedRead(racePath)
		} else if (abstractFile instanceof TFolder) {
			// Return a list of all files from given folder path
			const files = this.getAllFilesInFolder(abstractFile);
			// TODO: Get properties for more customization
			
			// Save each file name as an option
			(await files).map((file) => {
				npcOptions.push(file.basename);
				// NOTE: note link is created in getContent() class function.
			});
		} else {
			console.log('Not a valid path');
		}
		return npcOptions;
	}

	async generateNPCFile(): Promise<TFile | null> {
		try {
			const npc = new NPC(
				{
					'race': 'human'
				}
				// ["Adam", "Kyle", "Doug"], // Names
				// await this.getOptions(this.settings.racePath), // Race
			);
			console.log('Race (raw):', npc.race);
			console.log('Race (JSON):', JSON.stringify(npc.race));
			const npcFile = await this.app.vault.create(
				this.settings.npcPath+`/${npc.name}.md`,
				npc.getContent()
			)
			// await this.app.workspace.getLeaf().openFile(npcFile);
			// this.app.workspace.activeEditor?.editor?.setCursor({ line: 10, ch: 0});
			return npcFile;
		} catch (error) {
			console.error("Error creating NPC file:", error);
			new Notice("Failed to create NPC file");
			return null;
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		console.log("properties: ", this.plugin.settings.properties);
		
		
		new Setting(containerEl)
			.setName("NPC Folder")
			.setDesc('Specify a folder to store newly created NPCs')
			.addText(text => text
				.setPlaceholder('Specify a folder')
				.setValue(this.plugin.settings.npcPath)
				.onChange(async (value) => {
					// TODO: Verify it is a valid folder
					this.plugin.settings.npcPath = value;
					await this.plugin.saveSettings();
				}));
		// type SettingEntry = {
		// 	name: string;
		// 	description: string;
		// 	placeholder: string;
		// 	settingsKey: keyof RandomNPCSettings;
		// };
		
		// // const settings: SettingEntry[] = [
		// // 	{
		// // 		name: "NPC Folder",
		// // 		description: "Specify a folder to store new NPCs.",
		// // 		placeholder: 'Specify file or folder',
		// // 		settingsKey: 'npcPath'
		// // 	},
		// // 	{
		// // 		name: "Race Folder",
		// // 		description: 'Specify a folder with your NPC races.',
		// // 		placeholder: 'Specify file or folder',
		// // 		settingsKey: 'racePath'
		// // 	},
		// // 	{
		// // 		name: 'Profession',
		// // 		description: 'Specify a folder with your NPC professions.',
		// // 		placeholder: 'Specify a file or folder',
		// // 		settingsKey: 'professionPath'
		// // 	}
		// // ]

		// for (const setting of settings) {
		// 	new Setting(containerEl)
		// 		.setName(setting.name)
		// 		.setDesc(setting.description)
		// 		.addText(text => text
		// 			.setPlaceholder(setting.placeholder)
		// 			.setValue(this.plugin.settings[setting.settingsKey])
		// 			.onChange(async (value) => {
		// 				this.plugin.settings[setting.settingsKey] = value;
		// 				await this.plugin.saveSettings();
		// 			}));
		// }
		// const propertiesContainer = containerEl.createDiv(cls: 'setting')

		let newPropertyName = '';
		let textComponent: TextComponent | null = null;
		new Setting(containerEl)
			.setName("Add NPC Property")
			.setDesc("Add a new property to NPC generation")
			// Input for name of new property
			.addText(text => text
				.onChange((name) => {
					textComponent = text;
					newPropertyName = name;
				})
			)
			.addButton(button => button
				.setButtonText('New Property')
				// .setCta()
				.onClick((async () => {
					// Check if property has been named
					if (!newPropertyName) {
						new Notice("Please enter a property name first.");
						return;
					}

					// Check for duplicates
					if (this.plugin.settings.properties.hasOwnProperty(newPropertyName)) {
						new Notice(`Property "${newPropertyName}" already exists.`);
						return;
					}

					// Create new setting element
					new Setting(containerEl)
						.setName(newPropertyName)
						.addText(text => text
							.setPlaceholder('Specify a file or folder')
							.onChange(async (value) => {
								if (value) {
									this.plugin.settings.properties[newPropertyName] = value;
									await this.plugin.saveSettings();
								}
							}));
					// Initalize new property and save it
					this.plugin.settings.properties[newPropertyName] = '';
					await this.plugin.saveSettings();
					// Reset input
					if (textComponent) {
						textComponent.setValue('');
					}
					newPropertyName = ''; // reset name
				}))
			)

		// Display existing properties
		Object.entries(this.plugin.settings.properties).forEach(([name, value]) => {
			new Setting(containerEl)
				.setName(name)
				.addText(text => text
					.setValue(value)
					.onChange(async (newValue) => {
						this.plugin.settings.properties[name] = newValue;
						await this.plugin.saveSettings();
					}));
		});
	}
}

