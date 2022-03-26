/** @param {NS} ns **/
export async function main(ns) {
	const [target] = ns.args;
	const ok = await ns.prompt(`Are you sure you want to delete ${target}?`);
	if (ok) ns.deleteServer(target);
}