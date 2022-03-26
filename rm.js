/** @param {NS} ns **/
export async function main(ns) {
    const files = ns.ls('home', '.js')
        .filter((file) => file != 'rm.js');
    for (const file of files) {
        ns.rm(file);
    }
}