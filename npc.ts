export class NPC {
	name: string;
    properties: Record<string, string>

	constructor(properties: Record<string, string> = {}) {
		this.properties = properties;
	}
	
	getContent() {
        console.log('getContent props: ', this.properties);
        const frontmatter = Object.keys(this.properties).map((key) => {
            const value = this.properties[key];
            // TODO: Check if file or folder
            return `${key}: '[[${value}]]'`;
        }).join('\n');
		const npcContent = `---\n${frontmatter}\ntags: [npc]\n---`;
		return npcContent;
	}
	
}