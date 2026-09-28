const fs = require('fs');

let content = fs.readFileSync('c:/Users/utkar/SIH/sih-main/frontend/src/data/mockzones.js', 'utf8');

const zoneIds = [
  'Z-ODISHA-KENDRAPARA-01',
  'Z-ANDHRA-KRISHNA-01',
  'Z-WESTBENGAL-SUNDARBANS-01',
  'Z-MANIPUR-CHURACHANDPUR-01',
  'Z-RAJASTHAN-BARMER-01',
  'Z-MEGHALAYA-CHERRAPUNJI-01',
  'Z-TAMILNADU-NAGAPATTINAM-01',
  'Z-ASSAM-MAJULI-01',
  'Z-UTTARAKHAND-KEDARNATH-01',
  'Z-GUJARAT-SURAT-01',
  'Z-HIMACHAL-KULLU-01',
  'Z-MAHARASHTRA-RAIGAD-01'
];

zoneIds.forEach(zid => {
  const target = `zoneId: "${zid}",`;
  const idx = content.indexOf(target);
  if (idx !== -1) {
    const coordIdx = content.indexOf('coordinates: [', idx);
    if (coordIdx !== -1 && coordIdx - idx < 500) {
      content = content.slice(0, coordIdx) + `coordinates: KNOWN_ZONE_BOUNDARIES["${zid}"] || [` + content.slice(coordIdx + 'coordinates: ['.length);
      console.log('Linked KNOWN_ZONE_BOUNDARIES for', zid);
    }
  }
});

fs.writeFileSync('c:/Users/utkar/SIH/sih-main/frontend/src/data/mockzones.js', content, 'utf8');
console.log('Finished updating mockzones.js');
