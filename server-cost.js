/** @param {NS} ns **/
export async function main(ns) {
	const [ram] = ns.args;
	const cost = ns.getPurchasedServerCost(ram);
	ns.tprint(cost);
}