import { GangGenInfo, GangMemberInfo, GangOtherInfoObject, NS } from "../NetscriptDefinitions";
import { generateUuid } from "./scripts/util";

type OtherGangs = {
    [k: string]: GangOtherInfoObject;
}

export async function main(ns: NS) {
    ns.disableLog('ALL')
    while (true) {
        const memberNames = ns.gang.getMemberNames();
        const members = memberNames
            .map(name => ns.gang.getMemberInformation(name));
        const gang = ns.gang.getGangInformation();
        const gangs = otherGangs(ns, gang);
        recruit(ns);
        ascend(ns, members);
        buyEquipment(ns, members);
        setWork(ns, gang, members, gangs);
        startWarfare(ns, gang, gangs);
        await true;
        displayGangTable(ns, gang, members, gangs)
        await ns.asleep(5000);
    }
}

function displayGangTable(ns: NS, gang: GangGenInfo, members: GangMemberInfo[], gangs: OtherGangs) {
    const lines = [
        ns.sprintf(`┌%'─36s┬%'─20s┬%'─15s┐`, '', '', ''),
        ns.sprintf(`│%-36s│%-20s│%-15s│`, 'Name', 'Task', 'Respect'),
        ns.sprintf(`├%'─36s┼%'─20s┼%'─15s┤`, '', '', ''),
        ...members.map(member => ns.sprintf(`│%-36s│%-20s│%-15d│`, member.name, member.task, member.earnedRespect)),
        ns.sprintf(`├%'─36s┼%'─20s┴%'─15s┤`, '', '', ''),
        ns.sprintf(`│%-36s│%-36.2f│`, 'Clash Chance %', gang.territoryClashChance * 100),
        ns.sprintf(`├%'─36s┼%'─36s┤`, '', ''),
        ns.sprintf(`│%-36s│%-36.2f│`, 'Territory %', gang.territory * 100),
        ns.sprintf(`├%'─36s┼%'─36s┤`, '', ''),
        ns.sprintf(`│%-36s│%-36.2f│`, 'Efficiency %', gang.wantedPenalty * 100),
        ns.sprintf(`├%'─36s┼%'─36s┤`, '', ''),
        ns.sprintf(`│%-36s│%-36.2f│`, 'Average Clash Performance %', averageClashChance(ns, gangs) * 100),
        ns.sprintf(`└%'─36s┴%'─36s┘`, '', ''),
    ]
    ns.print(lines.join('\n'))
}

function otherGangs(ns: NS, gang: GangGenInfo) {
    const gangInfo = ns.gang.getOtherGangInformation();
    const otherGangs = Object.entries(gangInfo)
        .filter(([name]) => name != gang.faction);
    return Object.fromEntries(otherGangs) as OtherGangs;
}
function averageClashChance(ns: NS, gangs: OtherGangs) {
    const clashChances = Object.entries(gangs)
        .filter(([name, data]) => data.territory > 0)
        .map(([name]) => ns.gang.getChanceToWinClash(name));
    return clashChances
        .reduce((a, b) => a + b, 0) / clashChances.length;
}

function startWarfare(ns: NS, gang: GangGenInfo, gangs: OtherGangs) {
    const readyForWarfare = averageClashChance(ns, gangs) > 0.5 && gang.territory < 1 && gang.wantedPenalty >= 0.8
    ns.gang.setTerritoryWarfare(readyForWarfare)
}

function setWork(ns: NS, gang: GangGenInfo, members: GangMemberInfo[], gangs: OtherGangs) {
    const clashChanceAcceptable = averageClashChance(ns, gangs) < 0.80
    const canGainTerritory = gang.territory < 1
    const wantedPenaltyAcceptable = gang.wantedPenalty >= 0.8
    const needToFight = clashChanceAcceptable && canGainTerritory && wantedPenaltyAcceptable
    for (const member of members) {
        const stats = [member.agi, member.def, member.dex, member.str]
        const needsTraining = stats.some(stat => stat < 550)
        const canFight = stats.every(stat => stat >= 600)
        const task = needsTraining
            ? 'Train Combat'
            : needToFight && canFight
                ? 'Territory Warfare'
                : 'Human Trafficking'
        ns.gang.setMemberTask(member.name, task)
    }
}

function ascend(ns: NS, members: GangMemberInfo[]) {
    for (const member of members) {
        const ascendResult = ns.gang.getAscensionResult(member.name)
        if (ascendResult) {
            const gains = [ascendResult.agi, ascendResult.def, ascendResult.dex, ascendResult.str]
            const allGainsOver50 = gains.every(gain => gain > 1.1);
            const someGainsOver100 = gains.some(gain => gain > 1.5);
            if (allGainsOver50 || someGainsOver100)
                ns.gang.ascendMember(member.name)
        }
    }
}

function recruit(ns: NS, name: string = generateUuid()) {
    if (ns.gang.canRecruitMember()) ns.gang.recruitMember(name);
}
function purchaseMemberEquipment(ns: NS, member: GangMemberInfo, equipmentList: string[]) {
    equipmentList
        .filter(equipment => !member.upgrades.includes(equipment))
        .forEach(equipment => ns.gang.purchaseEquipment(member.name, equipment));
}
function buyEquipment(ns: NS, members: GangMemberInfo[]) {
    const allEquipment = ns.gang.getEquipmentNames();
    members.forEach(member => purchaseMemberEquipment(ns, member, allEquipment));
}
