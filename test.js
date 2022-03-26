/** @param {NS} ns **/
export async function main(ns) {
	ns.atExit(() => {
		ns.exec('free.js', 'home', 1, '', 0);
		ns.exec('free.js', 'home', 1, '', 0);
		ns.exec('free.js', 'home', 1, '', 0);
		ns.exec('free.js', 'home', 1, '', 0);
	});
	while (true) await ns.asleep(1000);
}