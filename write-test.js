/** @param {NS} ns **/
export async function main(ns) {
	const [amount] = ns.args;
	ns.tryWritePort(1, JSON.stringify({ type: 'allocate', ram: amount }));
}