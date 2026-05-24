const r = await fetch('https://pb.drsmode.net/api/collections/posts/records?page=1&perPage=1&filter=' + encodeURIComponent('slug = "f1-grand-prix-kanada-2026"'));
const j = await r.json();
console.log(JSON.stringify(j.items[0], null, 2));
