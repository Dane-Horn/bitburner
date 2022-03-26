import { getPaths } from './scripts/util.js'

/** @param {NS} ns **/
export async function main(ns) {
	const [target] = ns.args;
	const tree = getPaths(ns, ns.getHostname());
	if (target) ns.tprint(tree[target]);
	else ns.tprint(JSON.stringify(tree, null, 2));
	return tree;
}