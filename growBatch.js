import { wgw, getDelays, generateUuid, request } from 'scripts/util.js'

const delay = 1000;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;

/** @param {NS} ns **/
export async function main(ns) {
	const [target, targetGrowth, batches] = ns.args;
	while (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
		const batchDetails = wgw(ns, target, growScript, weakenScript, targetGrowth);
		const { growDelay, weakenDelay, longestTime } = getDelays(ns, target);
		for (let i = 0; i < batches; i++) {
			await runBatch(ns, batchDetails, target, growDelay, weakenDelay, delay);
		}
		await ns.asleep(longestTime);
	}
}

async function runBatch(ns, batchDetails, target, growDelay, weakenDelay, delay) {
	const { pid: weakenPid } = batchDetails.weaken.threads > 0 ?
		await request(ns, 1, 2, {
			type: 'allocate',
			script: weakenScript,
			threads: batchDetails.weaken.threads,
			args: [target, weakenDelay, 'weaken', generateUuid()],
		})
		: { pid: -1 };
	await ns.asleep(delay);
	const { pid: growPid } = batchDetails.grow.threads > 0
		? await request(ns, 1, 2, {
			type: 'allocate',
			script: growScript,
			threads: batchDetails.grow.threads,
			args: [target, growDelay, 'grow', generateUuid()],
		})
		: { pid: -1 };
	await ns.asleep(delay);
	const { pid: growWeakenPid } = batchDetails.growWeaken.threads > 0
		? await request(ns, 1, 2, {
			type: 'allocate',
			script: weakenScript,
			threads: batchDetails.growWeaken.threads,
			args: [target, weakenDelay, 'growWeaken', generateUuid()],
		})
		: { pid: -1 };
	ns.print(`${batchDetails.weaken.threads}:${batchDetails.grow.threads}:${batchDetails.growWeaken.threads}`);
	ns.print(`${batchDetails.weaken.cost}:${batchDetails.grow.cost}:${batchDetails.growWeaken.cost}`);
	if (!weakenPid || !growPid || !growWeakenPid) {
		ns.kill(weakenPid);
		ns.kill(growPid);
		ns.kill(growWeakenPid);
		ns.exit();
	}
	await ns.asleep(delay);
}