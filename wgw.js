import { wgw, getDelays, request, allocateAll, freeAll } from 'scripts/util.js'

/** @param {NS} ns **/
export async function main(ns) {
	const [target, targetPercentage] = ns.args;
	const delay = 1000;
	const growScript = `/scripts/grow.js`;
	const weakenScript = `/scripts/weaken.js`;
	const batchDetails = wgw(ns, target, growScript, weakenScript, targetPercentage);
	const allocationRequests = [
		{ type: 'allocate', ram: batchDetails.weaken.cost },
		{ type: 'allocate', ram: batchDetails.grow.cost },
		{ type: 'allocate', ram: batchDetails.growWeaken.cost },
	];
	const allocated = await allocateAll(ns, allocationRequests);
	const freeServers = () => {
		for (const { ram, allocatedServer } of allocated) {
			if (allocatedServer) ns.exec('free.js', 'home', 1, allocatedServer, ram);
		}
	};
	ns.atExit(freeServers);
	await ns.scp(weakenScript, allocated[0].allocatedServer);
	await ns.scp(growScript, allocated[1].allocatedServer);
	await ns.scp(weakenScript, allocated[2].allocatedServer);
	const { growDelay, weakenDelay } = getDelays(ns, target);
	if (batchDetails.weaken.threads) ns.exec(weakenScript, allocated[0].allocatedServer, batchDetails.weaken.threads, target, weakenDelay, 'weaken');
	await ns.asleep(delay);
	if (batchDetails.grow.threads) ns.exec(growScript, allocated[1].allocatedServer, batchDetails.grow.threads, target, growDelay, 'grow');
	await ns.asleep(delay);
	if (batchDetails.growWeaken.threads) ns.exec(weakenScript, allocated[2].allocatedServer, batchDetails.growWeaken.threads, target, weakenDelay, 'growWeaken');
	await ns.asleep(batchDetails.batchTime + (2 * delay));
	ns.atExit(() => {});
	freeServers();
}