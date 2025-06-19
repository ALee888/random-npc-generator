import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, Vault } from 'obsidian';
import { NPC } from './npc'
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
			
			new Notice('Created new NPC: ');

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

	async getRandomElement<T>(array: T[]): Promise<T | undefined> {
		if (array.length === 0) return undefined;
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	
	async generateNPCFile(npc: NPC): Promise<TFile | null> {
		try {
			// Go throught properties and generate random data for empty properties from the modal
			for (const [propertyKey, propertyValue] of Object.entries(npc.properties)) {
				console.log('key: ', propertyKey);
				console.log('value: ', propertyValue);
				// Only empty properties are randomly generated
				if (!propertyValue) {
					const options: string[] = await this.getOptions(this.settings.properties[propertyKey]);
					const chosen = await this.getRandomElement(options);
					if (chosen) {
						console.log("chosen: ", chosen)
						console.log('npcPropKey: ', npc.properties[propertyKey])
						npc.properties[propertyKey] = chosen as string;
						console.log("npcVal: ", npc.properties[propertyKey])
					} else {
						console.log("no options found for ", propertyKey);
					}
				}
				
			};

			console.log("npcVal2: ", npc.properties['profession'])
			console.log('NPC props pre-write: ', npc.properties);
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
	constructor(app: App, properties: Record<string, string>, onSubmit: (npc: NPC) => void) {
		super(app);
		this.setTitle('New NPC');

		// Create new npc object
		const npc = new NPC();
			
		// NPC name input
		new Setting(this.contentEl)
			.setName('Name')
			.addText((text) =>
				text.onChange((value) => {
					npc.name = value;
				}));

		// Make a input for each property
		Object.keys(properties).forEach(propertyKey => {
			npc.properties[propertyKey] = ''; // Make property default
			new Setting(this.contentEl)
				.setName(propertyKey)
				.setDesc('Enter value or leave blank for random')
				.addText(text => text
					.setPlaceholder('Enter value')
					.onChange(async (newValue: string) => {
						npc.properties[propertyKey] = newValue;
					}))
		});

		// Submit Button
		new Setting(this.contentEl)
			.addButton((btn) =>
				btn
				.setButtonText('Submit')
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
						
					this.plugin.settings.properties[newPropertyName] = ''; // Add new property to settings list
					await this.plugin.saveSettings(); // Save settings
					// newPropertyName = ''; // reset name
					this.display(); // Reload settings tab
				}))
			)

		// Display existing properties
		Object.entries(this.plugin.settings.properties).forEach(([name, value]) => {
			// Each property is a new setting
			new Setting(containerEl)
				.setName(name)
				.addDropdown(dropdown => dropdown
					.addOptions({
						'folder': 'Folder',
						'file': 'File'
					})
					.onChange(async (value) => {
						this.plugin.settings.properties
					}))
				.addText(text => text
					.setPlaceholder('Specify a file or folder')
					.setValue(value)
					.onChange(async (newValue) => {
						this.plugin.settings.properties[name] = newValue;
						await this.plugin.saveSettings();
					}))
				// Delete button
				.addButton(button => button
					.setButtonText('x')
					.onClick(( async () => {
						delete this.plugin.settings.properties[name];
						await this.plugin.saveSettings();
						this.display();
					}))
				)
		});
	}
}