export class NPC {
	name: string;
    properties: Record<string, string>
	race: string;
	gender: string;
	age: number;
	sex: string;
	appearance: string;
	profession: string;
	alignment: string;
	personalityTraits: string[];
	secret: string;
	plotHook: string;
	occupation: string;

	constructor(properties: Record<string, string>) {
		this.properties = properties;
	}

	getRandomElement<T>(array: T[]): T | undefined {
		if (array.length === 0) return undefined;
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	
	getContent() {
		const keysToInclude = ['race', 'profession', 'gender'];
		const frontmatter = keysToInclude.map(key => {
			const value = (this as any)[key];

			if (key === 'race') {
				return `${key}: '[[${value}]]'`;
			}

			return `${key}: ${value}`;
		}).join('\n');

		const npcContent = `---
${frontmatter}
tags: [npc, ${this.race.toLowerCase()}]
---

# ${this.name}`;
		console.log('race: ', this.race);
		return npcContent;
	}
	
}