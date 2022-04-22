import { NS } from "NetscriptDefinitions";
import { getAvailableServers } from "scripts/util"
const requestMap: any = {
    allocate: { func: allocate, hasResponse: true },
    allocateAll: { func: allocateAll, hasResponse: true },
}

const scriptTypeMap: any = {
    hack: { getServers: getAvailableServers },
    grow: { getServers: getAvailableServers },
    weaken: { getServers: getAvailableServers },
}

export async function main(ns: NS) {
    ns.clearPort(1);
    ns.clearPort(2);
    ns.disableLog('ALL');
    while (true) {
        const request = JSON.parse(await blockRead(ns, 1));
        ns.print(request);
        const { func, hasResponse } = requestMap[request.type];
        const response = await func(ns, request);
        ns.print(response);
        if (hasResponse) await ns.tryWritePort(2, JSON.stringify(response));
    }
}

// request: {script, threads, args}
// response: {pid: int}
async function allocate(ns: NS, request: AllocateRequest) {
    const { script, threads, args } = request;
    const cost = ns.getScriptRam(script) * threads;
    for (const { name, available } of getAvailableServers(ns)) {
        if (available >= cost) {
            await ns.scp(script, name);
            const pid = ns.exec(script, name, threads, ...args)
            return { ...request, pid };
        }
    }
    return { ...request, pid: 0 };
}

// request: {requests: [{script, threads, args}]}
// response: {pids: [int]}
async function allocateAll(ns: NS, request: AllocateAllRequest) {
    const { requests } = request;
    const servers = getAvailableServers(ns);
    for (const { script } of requests) {
        for (const { name } of servers) {
            await ns.scp(script, name);
        }
    }

    const targetedRequests = requests.map((request) => {
        const { script, threads } = request;
        const cost = ns.getScriptRam(script) * threads;
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].available >= cost && threads > 0) {
                servers[i].available -= cost;
                return Object.assign(request, { target: servers[i].name });
            }
        }
        return Object.assign(request, { target: null })
    });
    const pids = targetedRequests.map(({ script, target, threads, args }) => {
        return target
            ? ns.exec(script, target, threads, ...args)
            : 0;
    });
    return { ...request, pids };
}

async function blockRead(ns: NS, port: number) {
    while (ns.peek(port) == 'NULL PORT DATA') await ns.asleep(200);
    return ns.readPort(port);
}