const parseSpeed = (planoString) => {
    if (!planoString) return 500;
    const match = planoString.match(/(\d+)\s*(Mega|MB|Giga|GB|M|G)\b/i);
    if (match) {
        let value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('g')) {
            value *= 1000;
        }
        return value;
    }
    return 500; // default
};
console.log(parseSpeed("600 Mega Fibra Turbo + Wi-Fi 6 Mesh"));
console.log(parseSpeed("Fibra 700MB Gamer Pro"));
console.log(parseSpeed("Fibra 1GB Empresarial"));
console.log(parseSpeed("300 M"));
