export class NPC {
	name: string;
    properties: Record<string, string>
	outputTypes: Record<string, string>
	constructor(properties: Record<string, string> = {}, outputTypes: Record<string, string> = {}) {
		this.properties = properties;
		this.outputTypes = outputTypes
	}
	
	getContent() {
		console.log('properties: ', this.properties);
		console.log('outputTypes: ', this.outputTypes);
		let frontmatter: Record<string, any> = {};
		for (const [propertyKey, propertyVal] of Object.entries(this.properties)) {
			const type = this.outputTypes[propertyKey];
			if (type=='text') {
				frontmatter[propertyKey] = propertyVal;
			} else if (type == 'link') {
				console.log(propertyKey, ' is a list!')
				frontmatter[propertyKey] = `[[${propertyVal}]]`;
				// NOTE: if link or folder is specified earlier, the brackets "[[]]" could already be added
				// in which case just make this a part of text
			} else if (type == 'list') {
				frontmatter[propertyKey] = [propertyVal];
			} else if (type == 'number') {
				if (Number(propertyVal)) {
					console.log(propertyKey, ' is a valid number!')
					frontmatter[propertyKey] = Number(propertyVal)
				} else {
					console.log(propertyKey, ' is not a valid number!')
				}
			} else if (type == 'checkbox') {
				if (Boolean(propertyVal)) {
					console.log(propertyKey, ' is a valid boolean!')
					frontmatter[propertyKey] = Boolean(propertyVal);
				} else {
					console.log(propertyKey, ' is not a valid boolean!');
				}
			} else if (type == 'date') {
				const date = new Date(propertyVal)
				if (isNaN(date.getTime())) {
					console.log(propertyKey, " is not a valid date!");
				} else {
					console.log(propertyKey, ' is a valid date');
					frontmatter[propertyKey] = date;
				}
			} else {
				console.log('ERROR: no valid type specified: ', propertyKey);
			}
			// Add tags
			frontmatter['tags'] = ['npc'];
		}
        // const frontmatter = Object.keys(this.properties).map((key) => {
        //     const value = this.properties[key];
		// 	const type = this.outputTypes[key];
		// 	console.log("value: ", value);
		// 	console.log('type: ', type);
        //     // TODO: Check if file or folder
		// 	if (type == 'text') {
		// 		return `${key}: '${value}'`;
		// 	}
		// 	else if (type == 'link') {
        //     	return `${key}: '[[${value}]]'`;
		// 	} 
		// 	else if (type == 'checkbox') {
		// 		return `${key}: false`;
		// 	}
		// 	else {
		// 		return `${key}: `;
		// 	}
        // }).join('\n');
		console.log('Output Frontmatter: ', JSON.stringify(frontmatter));
		const npcContent = `---\n${JSON.stringify(frontmatter)}\n---`;
		console.log(npcContent);
		// const npcContent = `---\n${frontmatter}\ntags: [npc]\n---`;
		return npcContent;
	}
	
}