import { NS } from "NetscriptDefinitions";
import { getGrowTime, getHackTime, getWeakenTime } from "scripts/formulas";
const HACK_COST = 1.70;
const GROW_COST = 1.75;
const WEAKEN_COST = 1.70;
const DELAY = 35;
export function getAllHosts(ns: NS) {
    let q = ["home"];
    const duplicates = Array(30).fill('')
        .map(_ => q = [...new Set(
            q.map(s => [s, ns.scan(s)]).flat(2))]
        )
        .flat(2);
    return [...new Set(duplicates)];
}

export function getAvailableServers(ns: NS) {
    const servers = getAllHosts(ns)
        .map(host => ns.getServer(host))
        .filter(server => server.hostname !== 'home' && server.hasAdminRights)
        .map((server) => { return { name: server.hostname, available: server.maxRam - server.ramUsed } })
        .sort((a, b) => a.available - b.available);
    servers.push({ name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - 10 })
    return servers;
}

export function pick(obj: any, fields: string[]) {
    return fields
        .filter((field) => field in obj)
        .reduce((obj2: any, key) => (obj2[key] = obj[key], obj2), {});
}

export function getPaths(ns: NS, source: string) {
    const paths: { [x: string]: string[]; } = buildPaths(ns, source, 0, [], {});
    Object.entries(paths).forEach(([_key, path]) => path.shift());
    return paths;
}

export function buildPaths(ns: NS, current: string, depth: number, path: string[], result: { [x: string]: string[]; }) {
    path.push(current);
    result[current] = path;
    const neighbours = ns.scan(current)
        .filter((host) => !(host in result));
    if (neighbours.length == 0) return result;
    for (const neighbour of neighbours) {
        result = buildPaths(ns, neighbour, depth + 1, [...path], result);
    }
    return result;
}

export function getDelays(ns: NS, target: string) {
    const targetServer = ns.getServer(target);
    const player = ns.getPlayer();
    const weakenTime = getWeakenTime(targetServer, player);
    const hackTime = getHackTime(targetServer, player);
    const growTime = getGrowTime(targetServer, player);
    const longestTime = Math.max(weakenTime, hackTime, growTime);
    return {
        hackDelay: longestTime - hackTime,
        growDelay: longestTime - growTime,
        weakenDelay: longestTime - weakenTime,
        longestTime,
    };
}

export function hwgw(ns: NS, target: string, percentageToSteal: number) {
    const hackThreads = Math.ceil(percentageToSteal / ns.hackAnalyze(target));
    if (hackThreads === Infinity) throw new Error('infinite hack threads required');
    const maxBatches = Math.floor(ns.getWeakenTime(target) / (DELAY * 4));
    const targetServer = ns.getServer(target);
    targetServer.hackDifficulty = targetServer.minDifficulty;
    targetServer.moneyAvailable = targetServer.moneyMax;
    const weakenTime = ns.getWeakenTime(targetServer.hostname);
    const hackTime = ns.getHackTime(targetServer.hostname);
    const growTime = ns.getGrowTime(targetServer.hostname);
    const longestTime = Math.max(weakenTime, hackTime, growTime);
    const hackCost = HACK_COST * hackThreads;
    const hackGain = ns.hackAnalyze(target) * hackThreads;
    const hackAmountGain = ns.getServerMoneyAvailable(target) * hackGain;
    const hackSecurityGain = ns.hackAnalyzeSecurity(hackThreads);
    const hackWeakenThreads = weakenThreadsRequired(ns, hackSecurityGain);
    const hackWeakenCost = WEAKEN_COST * hackWeakenThreads;
    const percentageRequired = Math.min(1, (growthPercentageRequired(ns, target, hackGain)) || 0);
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 + (percentageRequired * 1.1))) || 1;
    const growCost = GROW_COST * growThreads;
    const growSecurityGain = ns.growthAnalyzeSecurity(growThreads);
    const growWeakenThreads = weakenThreadsRequired(ns, growSecurityGain);
    const growWeakenCost = WEAKEN_COST * growWeakenThreads;

    const gainPerMs = hackAmountGain / longestTime;
    const gainPerMsPerGB = gainPerMs / (hackCost + hackWeakenCost + growCost + growWeakenCost);
    return {
        maxBatches,
        batchTime: longestTime,
        gainPerMs,
        gainPerMsPerGB,
        totalCost: hackCost + hackWeakenCost + growCost + growWeakenCost,
        hack: {
            threads: hackThreads,
            cost: hackCost,
            time: hackTime,
            securityGain: hackSecurityGain,
            percentGain: hackGain,
            amountGain: hackAmountGain,
        },
        hackWeaken: {
            threads: hackWeakenThreads,
            cost: hackWeakenCost,
            time: weakenTime,
        },
        grow: {
            threads: growThreads,
            cost: growCost,
            time: growTime,
            securityGain: growSecurityGain,
        },
        growWeaken: {
            threads: growWeakenThreads,
            cost: growWeakenCost,
            time: weakenTime,
        },
    };
}

export async function runHackBatch(ns: NS, target: string, percentageToSteal: number, hackScript: string, growScript: string, weakenScript: string, delay: number, batches?: number) {
    const batchDetails = hwgw(ns, target, percentageToSteal);
    const { hackDelay, growDelay, weakenDelay } = getDelays(ns, target);
    let offset = 0;
    let requests: AllocateRequest[] = [];
    batches = Math.min(batches || 1, batchDetails.maxBatches);
    for (let i = 0; i < (batches); i++) {
        requests.push({
            type: 'allocate',
            script: hackScript,
            scriptType: "hack",
            threads: batchDetails.hack.threads,
            args: [target, hackDelay + (offset++ * delay), 'hack', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: weakenScript,
            scriptType: 'weaken',
            threads: batchDetails.hackWeaken.threads,
            args: [target, weakenDelay + (offset++ * delay), 'hackWeaken', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: growScript,
            scriptType: 'grow',
            threads: batchDetails.grow.threads,
            args: [target, growDelay + (offset++ * delay), 'grow', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: weakenScript,
            scriptType: 'weaken',
            threads: batchDetails.growWeaken.threads,
            args: [target, weakenDelay + (offset++ * delay), 'growWeaken', generateUuid()],
        });
    }
    const { pids } = await request(ns, 1, 2, { type: 'allocateAll', requests });
    if (pids.some((pid: number) => !pid)) {
        for (const pid of pids) {
            ns.kill(pid);
        }
        return 0;
    }
    return batches;
}

export function wgw(ns: NS, target: string, growScript: string, weakenScript: string, targetGrowth: number) {
    const targetServer = ns.getServer(target);
    const player = ns.getPlayer();
    const weakenTime = getWeakenTime(targetServer, player);
    const growTime = getGrowTime(targetServer, player);
    const longestTime = Math.max(weakenTime, growTime);

    const secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
    const weakenThreads = weakenThreadsRequired(ns, secDiff);
    const weakenCost = ns.getScriptRam(weakenScript) * weakenThreads;
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 + targetGrowth));
    const growCost = ns.getScriptRam(growScript) * growThreads;
    const growSecurityGain = ns.growthAnalyzeSecurity(growThreads);
    const growWeakenThreads = weakenThreadsRequired(ns, growSecurityGain);
    const growWeakenCost = ns.getScriptRam(weakenScript) * growWeakenThreads;

    return {
        host: target,
        batchTime: longestTime,
        totalCost: weakenCost + growCost + growWeakenCost,
        weaken: {
            threads: weakenThreads,
            cost: weakenCost,
            time: weakenTime,
        },
        grow: {
            threads: growThreads,
            cost: growCost,
            time: growTime,
            securityGain: growSecurityGain,
        },
        growWeaken: {
            threads: growWeakenThreads,
            cost: growWeakenCost,
            time: weakenTime,
        },
    };
}

export async function runGrowBatch(ns: NS, target: string, growScript: string, weakenScript: string, targetGrowth: number, delay: number, batches?: number) {
    const server = ns.getServer(target)
    let offset = 0;
    let requests: AllocateRequest[] = [];
    let pids = [0, 0, 0];
    let tries = 0;
    while (!pids.every((pid: number) => pid)) {
        if (tries++ >= 10) {
            ns.print('failed to run grow batch')
            ns.exit();
        }
        const batchDetails = wgw(ns, target, growScript, weakenScript, targetGrowth);
        const { growDelay, weakenDelay } = getDelays(ns, target);
        for (const pid of pids) {
            ns.kill(pid);
        }
        requests = [];
        if (server.hackDifficulty > server.minDifficulty) {
            requests.push({
                type: 'allocate',
                script: weakenScript,
                scriptType: 'weaken',
                threads: batchDetails.weaken.threads,
                args: [target, weakenDelay + (offset++ * delay), 'hackWeaken', generateUuid()],
            });
        }
        if (server.moneyAvailable < server.moneyMax) {
            requests.push({
                type: 'allocate',
                script: growScript,
                scriptType: 'grow',
                threads: batchDetails.grow.threads,
                args: [target, growDelay + (offset++ * delay), 'grow', generateUuid()],
            });
            requests.push({
                type: 'allocate',
                script: weakenScript,
                scriptType: 'weaken',
                threads: batchDetails.growWeaken.threads,
                args: [target, weakenDelay + (offset++ * delay), 'growWeaken', generateUuid()],
            });
        }
        offset++;
        const response = await request(ns, 1, 2, { type: 'allocateAll', requests });
        pids = response.pids;
        ns.print(pids)
        targetGrowth = targetGrowth * 0.5;
    }
}

export function weakenThreadsRequired(ns: NS, securityAmount: number) {
    let threads = 0;
    while (ns.weakenAnalyze(threads) < securityAmount) threads += 1;
    return threads + 1;
}

export function growthPercentageRequired(ns: NS, target: string, percentageLost: number) {
    const available = ns.getServerMoneyAvailable(target);
    const afterHack = available * (1 - percentageLost);
    const percentageRequired = (available - afterHack) / afterHack;
    return percentageRequired;
}

export function generateUuid() {
    const lut: any = []; for (let i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
        lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
        lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}

export async function request(ns: NS, requestPort: number, responsePort: number, request: any) {
    const requestId = generateUuid();
    const requestHandle = ns.getPortHandle(requestPort);
    const responseHandle = ns.getPortHandle(responsePort);
    requestHandle.tryWrite(JSON.stringify({ ...request, requestId }));
    while (responseHandle.empty() || JSON.parse(ns.peek(responsePort)).requestId != requestId) await ns.asleep(100);
    return JSON.parse(responseHandle.read() as string);
}

export async function noWaitRequest(ns: NS, requestPort: number, request: any) {
    const requestId = generateUuid();
    await ns.tryWritePort(requestPort, JSON.stringify({ ...request, requestId }));
    return;
}

export async function allocateAll(ns: NS, allocateRequests: any[]) {
    const result = [];
    for (const req of allocateRequests) {
        result.push(await request(ns, 1, 2, req));
    }
    return result;
}

export async function freeAll(ns: NS, freeRequests: any[]) {
    for (const req of freeRequests) {
        await noWaitRequest(ns, 1, req);
    }
}

export function mostEfficient(ns: NS, host: string, maxPercentage: number) {
    const range = (start: number, stop: number, step: number) =>
        Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
    return (range(0.05, maxPercentage, 0.05) || [1])
        .map((percentageToSteal) => { return { host, server: ns.getServer(host), hwgw: hwgw(ns, host, percentageToSteal) } })
        .sort((a, b) => b.hwgw.gainPerMsPerGB - a.hwgw.gainPerMsPerGB)[0];
}

export function rankServers(ns: NS, percentageToSteal = 0.05) {
    const hosts = getAllHosts(ns)
        .filter((host: string) => {
            const threadsNeeded = Math.ceil(0.5 / ns.hackAnalyze(host))
            return threadsNeeded !== Infinity;
        })
        .map((host) => mostEfficient(ns, host, percentageToSteal))
        // .filter(({ server: { hasAdminRights } }) => hasAdminRights)
        .filter(({ hwgw: { gainPerMsPerGB }, server: { moneyMax } }) => moneyMax && gainPerMsPerGB)
        .sort((a: { hwgw: { gainPerMsPerGB: number; }; }, b: { hwgw: { gainPerMsPerGB: number; }; }) => a.hwgw.gainPerMsPerGB - b.hwgw.gainPerMsPerGB)
        .map(({
            host,
            hwgw: {
                gainPerMsPerGB, hack, hackWeaken, grow, growWeaken, totalCost, batchTime, maxBatches,
            },
            server
        }) => {
            return {
                maxBatches,
                host,
                totalCost,
                batchTime,
                gainPerMsPerGB,
                costs: `${hack.cost}:${hackWeaken.cost}:${grow.cost}:${growWeaken.cost}`,
                ratio: `${hack.threads}:${hackWeaken.threads}:${grow.threads}:${growWeaken.threads}`,
                moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
                minSec: server.minDifficulty,
                currSec: server.hackDifficulty,
            }
        })
    return hosts;
}