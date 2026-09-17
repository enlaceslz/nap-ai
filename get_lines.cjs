const fs = require('fs');
let lines = fs.readFileSync('server.ts_patched', 'utf8').split('\n');
let errs = [120, 731, 750, 1160, 1194, 1224, 1242, 1254, 1279, 1282, 1303, 1488, 1507, 1508, 1514, 1525, 1527, 1528, 1531, 1538, 1552, 1562, 1564, 1572, 1583, 1585, 1586, 1589, 1595, 1604, 1610, 1620, 1634, 1644, 1646, 1648, 1689, 1690, 1693, 1714, 1717, 1741, 1747, 1805, 1806, 1825, 1849, 1859, 1900];

for (let e of errs) {
    let ln = e - 1; // 0-based
    console.log(`\n--- Line ${e} ---`);
    for (let i = ln - 2; i <= ln + 1; i++) {
        if (lines[i] !== undefined) {
            console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
        }
    }
}
