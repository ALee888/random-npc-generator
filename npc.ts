type valueType = string | number | any[] | Date | boolean | null;

export interface PropertyObject {
	value: valueType;
	source: string;
	type: string;
}

export class NPC {
	name: string;
    properties: Record<string, PropertyObject>
	// outputTypes: Record<string, string>
	constructor(properties: Record<string, PropertyObject> = {}) {
		this.properties = properties;
	}
	
	formatDate(dateStr: Date, includeTime: boolean = false): String {
		console.log(dateStr);
		const year = dateStr.getFullYear();
		const month = String(dateStr.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
		const day = String(dateStr.getDate()).padStart(2, '0');

		console.log("format: ", year, '-', month, '-', day)
		if (includeTime) {
			return `${year}-${month}-${day}`
		} else {
			return `${year}-${month}-${day}T`;
		}
	}

	getContent() {
		let frontmatter: Record<string, any> = {};
		for (const [propertyKey, propertyObj] of Object.entries(this.properties)) {
			const value = this.properties[propertyKey].value;
			const type = this.properties[propertyKey].type;
		
			if (type=='text') {
				frontmatter[propertyKey] = value;
			} else if (type == 'link') {
				console.log(propertyKey, ' is a list!')
				frontmatter[propertyKey] = `[[${value}]]`;
				// NOTE: if link or folder is specified earlier, the brackets "[[]]" could already be added
				// in which case just make this a part of text
			} else if (type == 'list') {
				console.log(value)
				frontmatter[propertyKey] = [value];
			} else if (type == 'number') {
				if (Number(value)) {
					console.log(propertyKey, ' is a valid number!')
					frontmatter[propertyKey] = Number(value)
				} else {
					console.log(propertyKey, ' is not a valid number!')
					frontmatter[propertyKey] = Number(value)
				}
			} else if (type == 'checkbox') {
				if (Boolean(value)) {
					console.log(propertyKey, ' is a valid boolean!')
					frontmatter[propertyKey] = Boolean(value);
				} else {
					console.log(propertyKey, ' is not a valid boolean!');
					frontmatter[propertyKey] = false;
				}
			} else if (type == 'date' || type == 'dateTime') {
				if (typeof value === 'string' || value instanceof Date || typeof value === 'number') {
					const date = new Date(value);
					if (isNaN(date.getTime())) {
						console.log(propertyKey, " is not a valid date!");
					} else {
						console.log(propertyKey, ' is a valid date');
						if (type === 'date') {
							frontmatter[propertyKey] = this.formatDate(date);
						} else {
							frontmatter[propertyKey] = date;
						}
					}
				} else {
					console.log(propertyKey, ' is not a string/date/number, so not a valid date input');
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