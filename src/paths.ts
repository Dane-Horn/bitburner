import { NS } from 'NetscriptDefinitions';
import { getPaths } from './scripts/util'

/** @param {NS} ns **/
export async function main(ns: NS) {
	const [target] = ns.args as [string];
	const tree = getPaths(ns, ns.getHostname());
	if (target) ns.tprint(tree[target]);
	else ns.tprint(JSON.stringify(tree, null, 2));
	return tree;
}