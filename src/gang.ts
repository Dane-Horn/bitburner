import { GangMemberInfo, NS } from "../NetscriptDefinitions";
import { generateUuid } from "./scripts/util";

export async function main(ns: NS) {
    while (true) {
        const memberNames = ns.gang.getMemberNames();
        const members = memberNames
            .map(name => ns.gang.getMemberInformation(name));
        await recruit(ns);
        await buyEquipment(ns, members);
        await ns.asleep(5000);
    }
}

async function recruit(ns: NS, name: string = generateUuid()) {
    if (ns.gang.canRecruitMember()) ns.gang.recruitMember(name);
}

async function buyEquipment(ns: NS, members: GangMemberInfo[]) {
    const allEquipment = ns.gang.getEquipmentNames()
    for (const member of members) {
        const unpurchasedEquipment = allEquipment
            .filter(equipment => !member.upgrades.includes(equipment))
        for (const equipment of unpurchasedEquipment) {
            const purchased = ns.gang.purchaseEquipment(member.name, equipment)
            if (purchased)
                ns.tprint(`purchased ${equipment} for ${member.name}`)
        }
    }
}
