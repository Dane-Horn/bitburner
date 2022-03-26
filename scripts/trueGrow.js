/** @param {NS} ns **/
export async function main(ns) {
	const [target, delay] = ns.args;
	while (true) {
		await ns.asleep(delay || 0);
		await ns.grow(target);
	}
}