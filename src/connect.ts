import { NS } from 'NetscriptDefinitions';
import { getPaths } from './scripts/util'

/** @param {NS} ns **/
export async function main(ns: NS) {
	const [target] = ns.args as [string];
	const paths = getPaths(ns, ns.getHostname());
	ns.tprint(paths);
	ns.tprint(target);
	ns.tprint(paths[target]);
	for (const host of paths[target]) {
		const result = ns.connect(host);
		ns.tprint(`connection to ${host}, result: ${result}`);
	}
}