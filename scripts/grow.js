/** @param {NS} ns **/
export async function main(ns) {
	const [target, delay] = ns.args;
	await ns.sleep(delay || 0);
	await ns.grow(target);
}