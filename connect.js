import { getPaths } from './scripts/util.js'

/** @param {NS} ns **/
export async function main(ns) {
	const [target] = ns.args;
	const paths = getPaths(ns, ns.getHostname());
	ns.tprint(paths);
	ns.tprint(target);
	ns.tprint(paths[target]);
	for (const host of paths[target]) {
		const result = ns.connect(host);
		ns.tprint(`connection to ${host}, result: ${result}`);
	}
}