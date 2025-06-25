import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, Vault } from 'obsidian';
import { NPC, PropertyObject } from './npc';
// Remember to rename these classes and interfaces!


interface RandomNPCSettings {
	npcPath: string;
	properties: Record<string, PropertyObject>;
}

const DEFAULT_SETTINGS: RandomNPCSettings = {
	npcPath: '',
	properties: {}
}

const DEFAULT_PROPERTY: PropertyObject = {value: null, source: '', type: ''};

export default class MyPlugin extends Plugin {
	settings: RandomNPCSettings;
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Generate random NPC', async (evt: MouseEvent) => {
			new NPCModal(this.app, this.settings.properties, (newNPC) => {
				this.generateNPCFile(newNPC)
			}).open();
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: 'generate-new-npc',
			name: 'Generate new NPC',
			callback: async () => {
				new NPCModal(this.app, this.settings.properties, (newNPC) => {
					this.generateNPCFile(newNPC)
				}).open();
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


	async getOptions(path: string): Promise<string[]> {
		let npcOptions: string [] = [];

		// Get the folder of file at the given path
		let abstractFile = this.app.vault.getAbstractFileByPath(path);
		
		// If it's not found and doesn't end in .md, try adding .md
		if (!abstractFile && !path.endsWith('.md')) {
			abstractFile = this.app.vault.getAbstractFileByPath(path + '.md');
		}

		// Check if the path is for a file or folder
		if (abstractFile instanceof TFile) {
			console.log('It\'s a file at ', path);
			// Read Content
			const content = await this.app.vault.read(abstractFile);
			// Get an option for each line in the file
			npcOptions = content.split('\n').map(line => line.trim()).filter(Boolean);
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
			console.log('Not a valid path: ' + path)
			new Notice('Not a valid path: ' + path);
		}
		return npcOptions;
	}

	async getRandomElement<T>(array: T[]): Promise<T | undefined> {
		if (array.length === 0) return undefined;
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	
	async generateNPCFile(npc: NPC): Promise<TFile | null> {
		try {
			// Go throught properties and generate random data for empty properties from the modal
			for (const [propertyKey, propertyObject] of Object.entries(npc.properties)) {
				// Only empty properties are randomly generated
				if (propertyObject.value === null) {
					const options: string[] = await this.getOptions(propertyObject.source);
					const chosen = await this.getRandomElement(options);
					if (chosen) {
						npc.properties[propertyKey].value = chosen; // Set property value to chosen element
					} else {
						console.log("no options found for ", propertyKey);
					}
				}
			};

			// Determine filename
			let fileName = '';
			if (npc.name) fileName = npc.name; // The the npc has a name use that
			else fileName = 'new_npc'

			// Create File
			const npcFile = await this.app.vault.create(
				this.settings.npcPath+`/${fileName}.md`,
				npc.getContent()
			)

			// Optional opening of file
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

// New modal that allows user to specify certain properties of the note
class NPCModal extends Modal {
	constructor(app: App, properties: Record<string, PropertyObject>, onSubmit: (npc: NPC) => void) {
		super(app);
		this.setTitle('New NPC');

		// Create new npc object
		const npc = new NPC(properties);
		console.log(properties);
		// NPC name input
		new Setting(this.contentEl)
			.setName('Name')
			.addText((text) =>
				text.onChange((value) => {
					npc.name = value;
				}));

		// Make a input for each property
		Object.keys(properties).forEach(propertyKey => {
			const propertyType = npc.properties[propertyKey].type;
			const placeholders: Record<string, string> = {
				'text': 'Enter value',
				'link': 'Enter value',
				'list': 'Enter comma separated values',
				'number': 'Enter number',
				'checkbox': 'Enter true or false',
				'date': 'Enter date (YYYY-MM-DD)',
				'dateTime': 'Enter date with time (YYYY-MM-DD HH:MM:SS)'
			}

			new Setting(this.contentEl)
				.setName(propertyKey)
				.setDesc('Enter value or leave blank for random. Then set property type in the dropdown.')
				// .addDropdown(dropdown => dropdown
				// 	.setValue(npc.outputTypes[propertyKey])
				// 	.addOptions({
				// 		'text': 'Text',
				// 		'link': 'Link',
				// 		'list': 'List',
				// 		'number': 'Number',
				// 		'checkbox': 'Checkbox',
				// 		'date': 'Date',
				// 		'dateTime': 'Date and Time'
				// 	})

				// 	.onChange(async (value) => {
				// 		npc.outputTypes[propertyKey] = value;
				// 	}))
				.addText(value => value
					.setPlaceholder(placeholders[propertyType])
					.onChange(async (newValue: string) => {
						npc.properties[propertyKey].value = newValue;
					}))
		});

		// Submit Button
		new Setting(this.contentEl)
			.addButton((btn) =>
				btn
				.setButtonText('Create')
				.setCta()
				.onClick(() => {
					this.close();
					onSubmit(npc);
				}));
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
		// console.log("properties: ", this.plugin.settings.properties);
		
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

		// Dynamic settings
		let newPropertyName = '';
		new Setting(containerEl)
			.setName("Add NPC Property")
			.setDesc("Add a new property to NPC generation")
			// Input for name of new property
			.addText(text => text
				.setPlaceholder('Property name')
				.onChange((name) => {
					newPropertyName = name;
				})
			)
			.addButton(button => button
				.setButtonText('New Property')
				// .setCta()
				.onClick(( async () => {
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

					// Add new property
					this.plugin.settings.properties[newPropertyName] = {value: null, source: '', type: 'text'}; // Create settings object
					await this.plugin.saveSettings(); // Save settings
					this.display(); // Reload settings tab
				}))
			)

		// Display existing properties
		Object.entries(this.plugin.settings.properties).forEach(([propertyName, propertyValue]) => {
			console.log("key: ", propertyName, ' / val: ', propertyValue.type)
			// Each property is a new setting
			new Setting(containerEl)
				.setName(propertyName)
				// .addDropdown(dropdown => dropdown
				// 	.addOptions({
				// 		'folder': 'Folder',
				// 		'file': 'File'
				// 	})
				// 	.onChange(async (value) => {
				// 		console.log(value);
				// 	}))
				.addDropdown(propertyTypes => propertyTypes
					.addOptions({
						'text': 'Text',
						'link': 'Link',
						'list': 'List',
						'number': 'Number',
						'checkbox': 'Checkbox',
						'date': 'Date',
						'dateTime': 'Date and Time'
					})
					.setValue(propertyValue.type)
					.onChange(async (propType) => {
						this.plugin.settings.properties[propertyName].type = propType;
						await this.plugin.saveSettings();
					}))
				.addText(source => source
					.setPlaceholder('Specify a file or folder')
					.setValue(propertyValue.source)
					.onChange(async (newSource) => {
						this.plugin.settings.properties[propertyName].source = newSource;
						await this.plugin.saveSettings();
					}))
				// Delete button
				.addButton(button => button
					.setButtonText('x')
					.onClick(( async () => {
						delete this.plugin.settings.properties[propertyName];
						await this.plugin.saveSettings();
						this.display();
					}))
				)
		});
	}
}