/*
usage: run repNeededForFavor.js favorTarget
    returns how much reputation you need in total with a faction or company to reach the favor favorTarget.
    (as of v0.37.1, the constans are the same for factions and companies)
formula adapted from Faction.js/getFavorGain(), Company.js/getFavorGain() and Constants.js:
    https://github.com/danielyxie/bitburner/blob/master/src/Faction.js
    
    also available as netscript 1.0 script (running in Firefox)
    https://github.com/sschmidTU/BitBurnerScripts/
    @author sschmidTU
*/

import { NS } from "../NetscriptDefinitions";

function repNeededForFavor(targetFavor: number) {
    
    let favorGain = 0;
    let rep = 0;
    
    let ReputationToFavorBase = 500;
    let ReputationToFavorMult = 1.02;
    
    let reqdRep = ReputationToFavorBase;
    while (favorGain < targetFavor) {
        rep += reqdRep;
        ++favorGain;
        reqdRep *= ReputationToFavorMult;
    }
    
    return rep;
}

export async function main(ns: NS) {
    let targetFavor = ns.args[0] as number;
    
    let repNeeded = repNeededForFavor(targetFavor);
    
    ns.tprint('you need ' + repNeeded.toLocaleString() + ' total reputation with a faction or company'
        + ' to get to ' + targetFavor + ' favor.');
}