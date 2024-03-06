function rinfLineAsStr (country : string, line: string) : string {
	if (country === 'AUT') { 
		const regex = /([0-9]{3,3})([0-9]{2,2})/;
		const match = line.match(regex);
		if (match) return match[1] + ' ' +  match[2];	
		else return line; }
	else return line;
}

export { rinfLineAsStr }