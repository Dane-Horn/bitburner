/** @param {NS} ns **/
export async function main(ns) {
	const [port] = ns.args;
	ns.tprint(ns.peek(port));
}