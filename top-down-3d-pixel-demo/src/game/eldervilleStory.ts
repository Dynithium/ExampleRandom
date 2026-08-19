import { create } from "zustand";
import { rt } from "./state";
import { sfx } from "./audio";

export const fatherMemoryLines = [
  "Everything and everyone has a purpose, which reflects their maker.",
  "Like this blade. It was made by me. It's designed for fighting — that's what it's for. But look.",
  "It has a sheath. And that sheath is made to show that it is not time for battle.",
  "I fear that one day, calamities might befall you. And it might just be... time for war.",
];

export type Dialog = { name: string; lines: string[] };

export const tinslaireInsideDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "You're up! The elders are at the door. The actual elders! They came to our house!",
    "They've been waiting since sunrise. You should go talk to them.",
    "And... don't forget father's blade. But not yet — they said not yet.",
  ],
};
export const tinslaireInsideRepeat: Dialog = { name: "Tinslaire", lines: ["Go on! The elders are waiting outside!"] };

export const tinslaireVillageDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "Brother! The village is so bright today. Have you seen the Grand Gardens?",
    "Elder Moss told me not to listen to the Central Well... but it really does hum.",
    "I'll be walking around the village. Come find me if you need me!",
  ],
};
export const tinslaireVillageRepeat: Dialog = {
  name: "Tinslaire",
  lines: ["Four trials with the elders, then the cave. You'll do great, Minslaire!"],
};

export const tinslaireNightDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "Yaaawn... it's getting dark outside, brother.",
    "The life suits hum louder at night, don't they?",
    "Make sure you get some rest before the trials tomorrow.",
  ],
};
export const tinslaireNightRepeat: Dialog = {
  name: "Tinslaire",
  lines: ["Goodnight, Minslaire! See you in the morning."],
};

export const elderMossDoorDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Good morning, Minslaire. I'm sorry for the early visit.",
    "We heard sounds from the cave — the old one, just on the outskirts of town, where the forest begins. Something's stirring in there that shouldn't be.",
    "We'd look ourselves, but we're old, and our bones aren't for crawling. You're young, you're quick, you know every path in this village.",
    "But before we ask you to go in there — and we will — we need to know who you are.",
    "The elders test character before blade. Four small trials, to see what kind of person we are sending.",
    "Come find us in the village when you are ready. Moss watches the Central Well on the outskirts, Sage the Blue House study, Thorn the widow. And the Bazaar watches honesty.",
  ],
};
export const elderMossDoorRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["We will not send you to the cave untested. Find us in the village — the trials await."],
};

// Trial 1 Dialogues (The Well's Echo)
export const elderMossWellIntroDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Ah, Minslaire. Welcome to your first test of virtue: The Well's Echo.",
    "The Central Well is the heart of Elderville's water supply. Every drop we drink comes through its rope and bucket.",
    "Walk over to the well, inspect the rope mechanism, and report back to me what you observe. A keen eye and an obedient heart are what we test.",
  ],
};
export const elderMossWellAssignedRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["Go inspect the rope at the Central Well just beside me. Let me know what you find."],
};
export const wellInspectDialog: Dialog = {
  name: "Central Well",
  lines: [
    "You lean over the mossy stone rim and inspect the rope and pulley...",
    "(CLANK... GRRRR... WHIRRR... HUMMM...)",
    "A low, metallic grinding reverberates from deep beneath the stone. Like heavy machinery turning in a hidden workshop...",
    "No hand-built village well should ever make a sound like this. You should report this to Elder Moss immediately.",
  ],
};
export const elderMossWellReportDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "You're back, Minslaire. Did you check the rope? What did you observe?",
    "(You describe the mechanical grinding and rhythmic clanking echoing beneath the well.)",
    "A grinding sound? Mechanical rumble? Nonsense. It's just the old underground water currents shifting against the bedrock.",
    "(He glances toward the Blue House, his face tensing sharply.)",
    "Nothing. There is nothing down there, Minslaire. Forget it.",
    "Still... your observation was thorough. You have passed the First Trial: The Well's Echo.",
    "Elder Sage awaits you outside the Council Hall for the Second Trial.",
  ],
};
export const elderMossWellCompletedRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["You passed the First Trial. Forget the sound at the well — focus on Sage's trial at the Council Hall."],
};

// Trial 2 Dialogues (The Scholar's Request)
export const elderSageStudyIntroDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "Ah, Minslaire! Elder Moss told me you passed his trial at the Central Well.",
    "Now begins the Second Trial: The Scholar's Request. We test wits, patience, and reverence for the past.",
    "Inside the Council Hall, my ancient archive bookcase is locked by an elemental harmony mechanism. An irreplaceable bio-frequency scroll is wedged inside.",
    "Inspect my study desk inside for the harmony order, align the 4 elemental dials on the northern bookcase, and bring me the scroll intact.",
  ],
};
export const elderSageStudyAssignedRepeat: Dialog = {
  name: "Elder Sage",
  lines: ["Step inside the Council Hall. Check my study desk for the harmony order and solve the bookcase dials."],
};
export const scholarDeskClueDialog: Dialog = {
  name: "Scholar's Journal",
  lines: [
    "You inspect Elder Sage's research journal open on the study desk...",
    "The passage is titled 'The Harmonious Order of the World':",
    "'1. First, the Mountain Earth (Green) anchored the bedrock.'",
    "'2. Second, the Deep Ocean (Blue) filled the hollows.'",
    "'3. Third, the Molten Core (Red) warmed the bio-membrane.'",
    "'4. Fourth, the Golden Sun (Gold) illuminated the seal.'",
    "(Remember this 4-element sequence: Green -> Blue -> Red -> Gold)",
  ],
};
export const elderSageStudyDeliverDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "By the stars... you unlocked the ancient archive without damaging the fragile parchment!",
    "(He unrolls the pre-war scroll with trembling, reverent hands)",
    "Look at this diagram: 'Resonant bio-synthetic frequency: 432 Hz... matches the subterranean pulse.' This is pivotal.",
    "You proved that patience and intellect triumph over brute force. You have passed the Second Trial: The Scholar's Request!",
    "Now find Elder Thorn near the Western Homesteads for the Third Trial.",
  ],
};
export const elderSageStudyCompletedRepeat: Dialog = {
  name: "Elder Sage",
  lines: ["You passed the Second Trial! Elder Thorn awaits near the Western Homesteads for the Third Trial."],
};

// Trial 3 Dialogues (The Widow's Task)
export const elderThornIntroDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "Minslaire. The elders tested your eyes at the well, and your intellect in the study. Now I test your heart.",
    "Old Widow Oren lives in the western homestead. Her husband's life suit failed years ago, and she lives alone.",
    "She has a heavy sack of harvest grain waiting in the Grand Gardens that she cannot carry on her own.",
    "Go to the Grand Gardens crop terraces, lift the grain sack, and deliver it safely to Widow Oren's home. Strength in Elderville is a debt of service, not a privilege.",
  ],
};
export const elderThornAssignedRepeat: Dialog = {
  name: "Elder Thorn",
  lines: ["Go to the Grand Gardens, lift the grain sack, and bring it to Widow Oren in the western homestead."],
};
export const gardenGrainPickupDialog: Dialog = {
  name: "Harvest Grain",
  lines: [
    "You approach the heavy sack of golden harvest grain resting on the crop terrace...",
    "You lift the heavy sack onto your shoulder with firm resolve. Your life suit hums warmly, bracing against the weight.",
    "(Deliver the grain sack to Widow Oren inside the Farmer's Homestead)",
  ],
};
export const widowOrenDeliverDialog: Dialog = {
  name: "Widow Oren",
  lines: [
    "Oh, bless your noble heart, Minslaire! My poor knees ache so terribly with the cold air...",
    "You carried this entire sack all the way from the garden terraces?",
    "(She reaches into her worn apron pocket and pulls out 3 shiny silver coins)",
    "Please, take these silver coins. It is all I have left, but you have saved my winter.",
  ],
};
export const minslaireDeclineRewardDialog: Dialog = {
  name: "Minslaire",
  lines: [
    "Keep your silver, Mother Oren. As long as my life suit breathes, you will never carry grain alone.",
  ],
};
export const widowOrenBlessedDialog: Dialog = {
  name: "Widow Oren",
  lines: [
    "(Tears fill her gentle eyes as she clasps your hands)",
    "Your father possessed that exact same honorable soul, Minslaire. May the blessing of the ancients guard your steps.",
  ],
};
export const elderThornCompleteDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "(Elder Thorn steps forward from the doorway, his weathered face filled with profound respect)",
    "You asked for no silver. You served a widow with honor, dignity, and grace.",
    "Your father would be deeply proud, Minslaire. You have passed the Third Trial: The Widow's Task!",
    // Thorn is the only elder who voted against sending Minslaire. He can't say
    // so yet, but he can let one crack show — and immediately close it. This is
    // the first seed of the betrayal, planted by the man who will pay for it.
    "(He holds your gaze a moment too long, then glances toward the Blue House)",
    "...Minslaire. When they give you a gift, look at it twice. That is all I will say.",
    "Only one trial remains: The Honest Change at the Southern Marketplace Bazaar.",
  ],
};
export const elderThornCompletedRepeat: Dialog = {
  name: "Elder Thorn",
  lines: ["You passed the Third Trial! Head to the Southern Marketplace for the Fourth Trial."],
};

// Trial 4 Dialogues (The Honest Change)
export const traderIntroDialog: Dialog = {
  name: "Bazaar Trader",
  lines: [
    "Welcome to the Elderville Bazaar, young wanderer! The Council sent word you need expedition provisions.",
    "Here is your pack of rations, climbing cord, and toolkits...",
    "(He counts out your payment pouch and accidentally hands you 50 EXTRA silver coins!)",
    "There you are, all squared away! Safe travels into the wilds!",
  ],
};

/**
 * Trial 4 is the only trial the player faces with Tinslaire beside them. The
 * elders are testing Minslaire's honesty; Minslaire is unknowingly teaching his
 * brother what to do with power he wasn't supposed to have. Act II turns on
 * Tinslaire deciding the elders' betrayal justified his own ruthlessness — so
 * he needs a memory of his brother choosing the other way, with a specific
 * number attached to it.
 */
export const tinslaireTemptationDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "(Tinslaire tugs your sleeve, eyes huge, whispering behind his hand)",
    "Brother. Brother. He gave you fifty extra. FIFTY. I counted twice.",
    "He didn't even look. Nobody saw. We could get the good bread. The soft kind, from the Gardens.",
    "...You're going to give it back, aren't you. You always do the hard one.",
  ],
};
export const traderHonestyReturnDialog: Dialog = {
  name: "Bazaar Trader",
  lines: [
    "(You gently hand back the extra pouch of 50 silver coins, explaining the mistake.)",
    "By the heavens above... you returned fifty silver coins?!",
    "Most runners in the outer districts would have pocketed that without a second thought!",
    "The Council of Elders was observing from the arcade. You have passed the Fourth Trial: The Honest Change!",
    "Take this trader's blessing, Minslaire: 'The suit's hum will guide you home.' Now report to the Council Hall for your blade trial!",
  ],
};
export const tinslaireHonestyWitnessDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "(He watches the pouch go back across the counter, very quiet for once)",
    "Fifty silver. And you just... handed it over.",
    "Nobody would have known, Minslaire. Nobody. That's what I keep thinking about.",
    "I'm going to remember this. I don't know why. I just am.",
  ],
};
export const traderCompletedRepeat: Dialog = {
  name: "Bazaar Trader",
  lines: ["May honor guide your blade, Minslaire! The Council gathers behind the Blue House to test your combat."],
};

// ===========================================================================
// Trials 5-10 — the expanded spine.
//
// These sit between the four virtue trials and the Trial of Steel. They exist
// to make Act I a game rather than a corridor of conversations: each one has a
// verb the player performs (light, set, inspect, weigh, parry, fight) and each
// one quietly moves the betrayal plot forward. Read in order, trials 5-10 are
// the elders steadily converting Minslaire from a boy who is being tested into
// an asset who is being surveyed, provisioned, and aimed east.
// ===========================================================================

// ---- Trial 5: The Night Watch (observation) -------------------------------
export const watchIntroDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "You've proven you're honest. Now prove you can pay attention when it's cold and nothing is happening.",
    "Three signal braziers on the north rampart. If the forest ever moves on us, that line is how the village knows.",
    "The lighting order is in the watch roster, in the Plaza Watchhouse. Read it. Do not guess it.",
    "(The order matters. Light them wrong and the whole line gutters out and you start again.)",
  ],
};
export const watchLedgerDialog: Dialog = {
  name: "Watch Roster",
  lines: [
    "A tallow-stained board nailed above the bench. The current watch order is chalked across the top:",
    "'WEST FIRST — then EAST — then CENTRE LAST, so the centre man sees both wings already burning before he lights.'",
    "Beneath, in a different hand: 'Any fool lights left to right. That is how we lost the Karrow watch.'",
    "(West, then East, then Centre. The braziers stand along the north rampart.)",
  ],
};
export const watchWrongDialog: Dialog = {
  name: "Signal Braziers",
  lines: [
    "The flame catches, gutters — and the whole line snuffs itself out in a chain, west to east.",
    "Wrong order. The roster was specific for a reason.",
    "(Start the sequence again: West, then East, then Centre.)",
  ],
};
export const watchLitDialog: Dialog = {
  name: "Signal Braziers",
  lines: [
    "The last brazier catches and holds. Three points of fire along the rampart, steady in the wind.",
    "From up here you can see a long way east. The forest is very dark, and very still.",
    "(Report the completed watch to Elder Thorn.)",
  ],
};
export const watchCompleteDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "Lit in the right order, on the first full run. Good.",
    "(He looks north along the burning line, and something in his face closes.)",
    "You know what that line is actually for, boy? It isn't to warn you. It's to warn us — about whatever is coming back down that road.",
    "★ Trial 5 passed: The Night Watch.",
  ],
};

// ---- Trial 6: The Dry Cistern (puzzle) ------------------------------------
export const sluiceIntroDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "The aqueduct is running full and the cistern is bone dry. That is not possible, which means I am wrong about something.",
    "Three sluice gates along the channel. Each sits shut, half, or open.",
    "Here is what the old engineers wrote: 'The head gate feeds the run. The middle gate must hold, or the water is lost to the pond. The last is throttled, never thrown, or the channel overtops.'",
    "Translate that into gate positions and the cistern fills. Get it wrong and you will simply watch water go somewhere useless.",
  ],
};
export const sluiceNoteDialog: Dialog = {
  name: "Sluice Gate",
  lines: [
    "A stone gate in the aqueduct wall, worn smooth by hands older than the village.",
    "It moves through three settings: SHUT, HALF, OPEN.",
    "(Head gate open. Middle gate shut. Last gate half.)",
  ],
};
export const sluiceSolvedDialog: Dialog = {
  name: "The Aqueduct",
  lines: [
    "The channel shudders. Water shoulders past the head gate, is turned by the middle, and slides throttled through the last.",
    "Below, the cistern begins to fill — loud, then quieter, then just a deep steady note under your boots.",
    "(Report to the cistern head.)",
  ],
};
export const sluiceCompleteDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "(He watches the cistern fill with an expression that is not quite pleasure)",
    "You read the instruction and you did not improvise. Do you know how rare that is?",
    "That matters more than you think, Minslaire. Where you are going, improvising will kill you.",
    "★ Trial 6 passed: The Dry Cistern.",
  ],
};

// ---- Trial 7: The Blighted Rows (service) ---------------------------------
export const blightIntroDialog: Dialog = {
  name: "Orchard Keeper",
  lines: [
    "Widow Oren said you were the one to ask. She said you carry things for people without being paid.",
    "Three rows on the western terrace are dying from underneath. Leaves fine, fruit fine, roots black.",
    "I am too old to kneel in all three. Walk them. Put your hand in the soil at each. You will know the bad one when you touch it.",
    "(Inspect all three rows on the orchard terrace.)",
  ],
};
export const blightRowCleanDialog: Dialog = {
  name: "Orchard Row",
  lines: [
    "You dig two fingers into the loam. Cool, damp, alive. Worms move away from your hand.",
    "This row is fine.",
  ],
};
export const blightRowRotDialog: Dialog = {
  name: "Orchard Row",
  lines: [
    "The soil here is warm. Not sun-warm — warm from below, like something under it is working.",
    "You pull your hand back and the dirt on your fingers smells of hot metal and oil.",
    "Not a blight. Something is buried in this row, and it is running.",
  ],
};
export const blightCompleteDialog: Dialog = {
  name: "Orchard Keeper",
  lines: [
    "The middle row. Warm soil, and it smelled of the forge.",
    "(The old man goes very quiet, then makes a sign over his chest you have not seen anyone make before)",
    "I will tell the Council. You will not tell anyone. Do you understand me, boy? Not the Council — I will tell the Council. You say nothing.",
    "★ Trial 7 passed: The Blighted Rows.",
  ],
};

// ---- Trial 8: The Short Tally (puzzle) ------------------------------------
export const tallyIntroDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "The granary is short. Not spoiled, not rat-eaten — short, and the ledger balances perfectly.",
    "A ledger that balances while the room is empty is a ledger someone is maintaining.",
    "Read the tally board. Weigh all four sacks against it. Then come and tell me the number.",
    "(Read the ledger in the Granary, then weigh each of the four sacks.)",
  ],
};
export const tallyLedgerDialog: Dialog = {
  name: "Tally Board",
  lines: [
    "Four columns, chalked and re-chalked: NORTH 40 · EAST 40 · SOUTH 40 · WEST 40. Total 160.",
    "Signed at the base in a careful, elderly hand — the same hand as the Council Archive labels.",
    "(Weigh each of the four sacks and compare.)",
  ],
};
export const tallySackDialog: Dialog = {
  name: "Grain Sack",
  lines: ["You heft the sack onto the scale and read the beam.", "(Weighed. Three more to check against the board.)"],
};
export const tallyCompleteDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Well?",
    "(You tell him: the board says one hundred and sixty. The sacks weigh one hundred and ten. Fifty short.)",
    "(A pause exactly one beat too long.)",
    "Fifty. How precise of you. Yes — that will be the winter reserve, moved for safekeeping. I authorised it myself.",
    "Do not trouble yourself with the granary again, Minslaire. Some numbers are not yours to carry.",
    "★ Trial 8 passed: The Short Tally.",
  ],
};

// ---- Trial 9: The Muster (combat drill) -----------------------------------
export const musterIntroDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "Enough errands. If they are sending you anywhere, you are going to know how to not die on the way.",
    "This is a drill, not a duel. I call, you answer. Three calls.",
    "GUARD when I swing — hold R. DODGE when I lunge — tap SHIFT. STRIKE when I open — SPACE.",
    "(Answer Thorn's three calls correctly.)",
  ],
};
export const musterCallGuardDialog: Dialog = {
  name: "Elder Thorn",
  lines: ["GUARD!", "(Hold R as the blow comes in.)"],
};
export const musterCallDodgeDialog: Dialog = {
  name: "Elder Thorn",
  lines: ["Good. DODGE — now!", "(Tap SHIFT to roll clear of the lunge.)"],
};
export const musterCallStrikeDialog: Dialog = {
  name: "Elder Thorn",
  lines: ["I'm open. STRIKE!", "(Hit him with SPACE.)"],
};
export const musterCompleteDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "(He lowers his guard, breathing hard, and looks at you a long moment)",
    "Your father drilled exactly like that. Same hitch before the riposte. He never fixed it either.",
    "Listen to me. Everything after today, you do slower than they tell you to. Slower, and looking around.",
    "★ Trial 9 passed: The Muster.",
  ],
};

// ---- Trial 10: The Scrap in the Quarry (combat) ---------------------------
export const scrapIntroDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "The quarry face collapsed in the night and something came out of it. Three somethings.",
    "They are small, they are fast, and they are made of the same metal as whatever is humming under the well.",
    "Clear them out and bring me a fragment. Do not bring me all of one. Bring me a piece.",
    "(Descend the quarry ramp and destroy the three scrap constructs.)",
  ],
};
export const scrapEngageDialog: Dialog = {
  name: "???",
  lines: [
    "(Three low shapes uncoil out of the spoil heaps, plates grinding as they rise)",
    "They have no faces. They orient on you anyway.",
    "(Strike with SPACE. Loose arrows with K. SHIFT to dodge. Guard with R.)",
  ],
};
export const scrapClearedDialog: Dialog = {
  name: "The Quarry",
  lines: [
    "The last construct folds up and stops.",
    "In the quarry face behind them there is a shaft that nobody in Elderville dug — smooth-walled, perfectly round, going down.",
    "(Take a fragment to Elder Sage.)",
  ],
};
export const scrapCompleteDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "(He turns the fragment over twice and does not ask a single question about the shaft)",
    "Good. This is enough to work from.",
    "You have done ten things for us, Minslaire. There are two left. After that you will be ready.",
    "(He says 'ready' the way a man says it about a tool, not a boy.)",
    "★ Trial 10 passed: The Scrap in the Quarry.",
  ],
};

// Combat Trial Dialogue (Behind Blue House)
export const councilCombatTrialDialog: Dialog = {
  name: "The Council of Elders",
  lines: [
    "Minslaire! You have proven your virtue across all four trials: Observation at the Well, Intellect in the Archives, Service for the Widow, and Integrity at the Bazaar.",
    "Now the Council tests your steel. In the training clearing behind the Blue House, three practice dummies stand ready.",
    "Elder Thorn will watch your footwork: STRIKE with SPACE toward your target, hold R to GUARD, and tap SHIFT to DODGE-ROLL — but mind your stamina, it fuels all three.",
    "Elder Sage has set archery boards beyond the dummies. Loose arrows with K — the blade is for when they get close; the bow is for when they don't.",
    "When the training dummies fall, you shall take your father's blade and enter the Outskirts Cave!",
  ],
};

// Outskirts Cave (Act 1 finale)
export const outskirtsCaveEnterDialog: Dialog = {
  name: "Outskirts Cave",
  lines: [
    "You take a torch from the post and step past the cold stone teeth of the entrance.",
    "The air changes at once — damp, still, and humming with something older than the village.",
    "Elder Moss's words follow you in: 'Whatever you find — bring it back. All of it. Don't leave the body.'",
  ],
};

export const caveBossAwakeDialog: Dialog = {
  name: "???",
  lines: [
    "(GRRRRK... WHIRRR... CLANK...)",
    "Two red eyes blink open in the dark.",
    "The Cave Machine shudders awake — rusted, wrong. The first machine anyone in Elderville has ever seen.",
    "(Strike with SPACE. Loose arrows with K. SHIFT to dodge its lunges. Guard with R.)",
  ],
};

export const caveBossDefeatedDialog: Dialog = {
  name: "Cave Machine",
  lines: [
    "It falls hard against the stone — and the cavern goes quiet.",
    "The great red eye dims... but keeps ticking. Faintly. Patiently.",
    "Moss's words come back: 'Don't leave the body.'",
    "(Lift the chassis and haul it back to the Forge in Elderville.)",
  ],
};

export const caveBodyLiftDialog: Dialog = {
  name: "Cave Machine",
  lines: [
    "You sling the heavy chassis over your shoulder.",
    "It hums against your back — warmer than the cave, softer than metal should be — all the way home.",
    "(Carry the body out of the cave and across Elderville to the Forge.)",
  ],
};

export const forgeDeliverDialog: Dialog = {
  name: "The Forge",
  lines: [
    "(The village gathers at the Forge as you set the chassis on the anvil.)",
    "Elder Sage lifts the eye from its socket — warm, ticking. He works through the night, tuning it to the blue beacon's frequency with the vault records.",
    "At dawn he sets a brass disc in your palm. The red eye, now a compass needle, tugs east.",
    "Elder Sage: 'We made this from what you brought us. It will point the way — and let us speak, even in the deep forest. If you fall, we'll see where.'",
    "Elder Moss: (hand too firm on your shoulder) 'For your safety, Minslaire. So you never have to be alone.'",
    "Elder Thorn does not come to the anvil. He stands at the edge of the firelight, watching the eye, and says nothing at all.",
    "Tinslaire, at your elbow, touches the eye and whispers: 'It's watching.'",
    "★ ACT I: THE CALLING — the trials are complete. The needle points east, to the forest.",
    "(Rest now, Minslaire. The Eastern Forest awaits in the next expedition.)",
  ],
};

export const lifeSuitRespawnDialog: Dialog = {
  name: "Life Suit",
  lines: [
    "Darkness. Then — the hum.",
    "Your life suit has carried you home to the Red House. You do not remember the road.",
    // Deliberately unexplained. The Safe Camp failsafe is the world's
    // inexplicable mercy and the seam Act III's reveal is sewn through; the
    // moment the text calls it mysterious, the player starts waiting for an
    // answer instead of sitting in the not-knowing. State it flatly and move on.
    "Your wounds are closed. The suit hums on, the way it always has.",
  ],
};

export const villageNPCsData: { id: string; name: string; tx: number; ty: number; color: string }[] = [
  { id: "tinslaire", name: "Tinslaire", tx: 12, ty: 13, color: "#4a90d9" },
  { id: "elderMoss", name: "Elder Moss", tx: 59, ty: 35, color: "#8b7355" },
  { id: "elderSage", name: "Elder Sage", tx: 32, ty: 12, color: "#73558b" },
  { id: "elderThorn", name: "Elder Thorn", tx: 16, ty: 26, color: "#6b6b8b" },
  { id: "bazaarTrader", name: "Bazaar Trader", tx: 15, ty: 40, color: "#c07840" },
];

export const swordCaseDialog: Dialog = {
  name: "Sword Case",
  lines: ["Your father's blade...", "Encased in glass the day he and mother vanished.", "It waits for its master. Pass the trials, and the glass will open."],
};

// Door elders positions (village tiles around Red House door at [12, 10])
export const eldersAtDoorPositions = [
  { id: "elderMossDoor", name: "Elder Moss", tx: 11, ty: 11, color: "#8b7355" },
  { id: "elderSageDoor", name: "Elder Sage", tx: 13, ty: 11, color: "#73558b" },
  { id: "elderThornDoor", name: "Elder Thorn", tx: 12, ty: 12, color: "#6b6b8b" },
];

export type TrialState = "not_started" | "assigned" | "inspected" | "desk_read" | "puzzle_solved" | "grain_picked" | "delivered" | "overpaid" | "completed";
export type CaveStage = "not_entered" | "entered" | "boss_awake" | "boss_defeated" | "delivered";

export type ElderState = {
  openingBlack: boolean;
  memoryActive: boolean;
  memoryIndex: number;
  memoryDone: boolean;
  tinslaireInsideTalked: boolean;
  eldersAtDoorReady: boolean;
  eldersDoorDialogDone: boolean;
  // 4 Virtue Trials
  wellTrialState: TrialState;
  scholarTrialState: TrialState;
  widowTrialState: TrialState;
  marketTrialState: TrialState;
  combatTrialState: TrialState;
  dummiesHealth: number[];
  // --- Trials 5-10 (the expanded spine; see quests.ts) ---
  watchTrialState: TrialState;
  /** north-rampart signal braziers, lit in ledger order */
  braziersLit: boolean[];
  /** the order the watchhouse ledger demands (indices into the brazier array) */
  watchOrder: number[];
  sluiceTrialState: TrialState;
  /** the three aqueduct sluice gates: 0 shut, 1 half, 2 open */
  sluiceGates: number[];
  blightTrialState: TrialState;
  rowsInspected: boolean[];
  /** which orchard row actually carries the rot */
  blightRow: number;
  tallyTrialState: TrialState;
  /** the four granary sacks the player has weighed */
  sacksWeighed: boolean[];
  musterTrialState: TrialState;
  /** Thorn's drill: the called moves the player has answered correctly */
  musterStep: number;
  scrapTrialState: TrialState;
  /** hp of the three quarry constructs */
  scrapHealth: number[];
  carryingGrain: boolean;
  hasSword: boolean;
  scholarPuzzleOpen: boolean;
  /** current archive-dial values (0 Earth · 1 Water · 2 Fire · 3 Light) */
  scholarDials: number[];
  // Act 1 finale — the Outskirts Cave
  caveStage: CaveStage;
  bossHp: number;
  carryingBody: boolean;
  hasCompass: boolean;
  currentArea: string;
  currentInterior: string | null;
  hp: number;
  st: number;
  // dialog queue
  activeDialog: { name: string; lines: string[]; index: number } | null;
  dialogSourceId: string | null;
  spoken: Set<string>;
  // helpers
  startMemory: () => void;
  advanceDialog: () => void;
  showDialog: (dlg: Dialog, sourceId: string | null) => void;
  setArea: (area: string, interior: string | null) => void;
  setOpeningBlack: (v: boolean) => void;
  setWellTrialState: (v: TrialState) => void;
  setScholarTrialState: (v: TrialState) => void;
  setWidowTrialState: (v: TrialState) => void;
  setMarketTrialState: (v: TrialState) => void;
  setCombatTrialState: (v: TrialState) => void;
  setWatchTrialState: (v: TrialState) => void;
  lightBrazier: (i: number) => "ok" | "wrong" | "ignored";
  setSluiceTrialState: (v: TrialState) => void;
  cycleSluice: (i: number) => void;
  setBlightTrialState: (v: TrialState) => void;
  inspectRow: (i: number) => void;
  setTallyTrialState: (v: TrialState) => void;
  weighSack: (i: number) => void;
  setMusterTrialState: (v: TrialState) => void;
  advanceMuster: () => void;
  setScrapTrialState: (v: TrialState) => void;
  damageScrap: (i: number, dmg: number) => void;
  setScholarPuzzleOpen: (v: boolean) => void;
  setScholarDials: (d: number[]) => void;
  damageDummy: (index: number, dmg: number) => void;
  setCaveStage: (v: CaveStage) => void;
  damageBoss: (dmg: number) => void;
  hurt: (dmg: number) => void;
};

export const useElder = create<ElderState>((set, get) => ({
  openingBlack: true,
  memoryActive: false,
  memoryIndex: 0,
  memoryDone: false,
  tinslaireInsideTalked: false,
  eldersAtDoorReady: false,
  eldersDoorDialogDone: false,
  wellTrialState: "not_started",
  scholarTrialState: "not_started",
  widowTrialState: "not_started",
  marketTrialState: "not_started",
  combatTrialState: "not_started",
  dummiesHealth: [60, 60, 60],
  watchTrialState: "not_started",
  braziersLit: [false, false, false],
  // West, East, Centre — deliberately not left-to-right, so the ledger must be read
  watchOrder: [0, 2, 1],
  sluiceTrialState: "not_started",
  sluiceGates: [0, 0, 0],
  blightTrialState: "not_started",
  rowsInspected: [false, false, false],
  blightRow: 1,
  tallyTrialState: "not_started",
  sacksWeighed: [false, false, false, false],
  musterTrialState: "not_started",
  musterStep: 0,
  scrapTrialState: "not_started",
  scrapHealth: [40, 40, 40],
  carryingGrain: false,
  hasSword: false,
  scholarPuzzleOpen: false,
  scholarDials: [2, 0, 3, 1],
  caveStage: "not_entered",
  bossHp: 40,
  carryingBody: false,
  hasCompass: false,
  currentArea: "home",
  currentInterior: "home",
  hp: 100,
  st: 100,
  activeDialog: null,
  dialogSourceId: null,
  spoken: new Set<string>(),

  startMemory: () => set({ memoryActive: true, memoryIndex: 0, activeDialog: { name: "Father", lines: fatherMemoryLines, index: 0 }, dialogSourceId: "fatherMemory" }),
  showDialog: (dlg, sourceId) => set({ activeDialog: { name: dlg.name, lines: dlg.lines, index: 0 }, dialogSourceId: sourceId }),
  setWellTrialState: (v) => set({ wellTrialState: v }),
  setScholarTrialState: (v) => set({ scholarTrialState: v }),
  setWidowTrialState: (v) => set({ widowTrialState: v }),
  setMarketTrialState: (v) => set({ marketTrialState: v }),
  setCombatTrialState: (v) => set({ combatTrialState: v }),
  setScholarPuzzleOpen: (v) => set({ scholarPuzzleOpen: v }),
  setScholarDials: (scholarDials) => set({ scholarDials }),

  // ---- Trial 5: The Night Watch -------------------------------------------
  setWatchTrialState: (v) => set({ watchTrialState: v }),
  /**
   * Light a signal brazier. The ledger in the watchhouse gives an order that is
   * deliberately not left-to-right; lighting out of turn snuffs the whole line
   * and you start the sequence again.
   */
  lightBrazier: (i) => {
    const s = get();
    if (s.watchTrialState !== "assigned") return "ignored";
    if (s.braziersLit[i]) return "ignored";
    const litCount = s.braziersLit.filter(Boolean).length;
    const expected = s.watchOrder[litCount];
    if (i !== expected) {
      set({ braziersLit: [false, false, false] });
      return "wrong";
    }
    const next = [...s.braziersLit];
    next[i] = true;
    const all = next.every(Boolean);
    set({ braziersLit: next, watchTrialState: all ? "inspected" : s.watchTrialState });
    return "ok";
  },

  // ---- Trial 6: The Dry Cistern -------------------------------------------
  setSluiceTrialState: (v) => set({ sluiceTrialState: v }),
  /**
   * Cycle one sluice gate shut -> half -> open -> shut.
   * The cistern only fills on [open, shut, half]: the head gate feeds the run,
   * the middle gate must be shut or the water spills to the pond, and the last
   * is throttled to half or the channel overtops. Sage's note states the rule;
   * the player has to translate it into gate positions.
   */
  cycleSluice: (i) => {
    const s = get();
    if (s.sluiceTrialState !== "assigned") return;
    const gates = [...s.sluiceGates];
    gates[i] = (gates[i] + 1) % 3;
    const solved = gates[0] === 2 && gates[1] === 0 && gates[2] === 1;
    set({ sluiceGates: gates, sluiceTrialState: solved ? "inspected" : s.sluiceTrialState });
  },

  // ---- Trial 7: The Blighted Rows -----------------------------------------
  setBlightTrialState: (v) => set({ blightTrialState: v }),
  inspectRow: (i) => {
    const s = get();
    if (s.blightTrialState !== "assigned") return;
    if (s.rowsInspected[i]) return;
    const next = [...s.rowsInspected];
    next[i] = true;
    set({ rowsInspected: next, blightTrialState: next.every(Boolean) ? "inspected" : s.blightTrialState });
  },

  // ---- Trial 8: The Short Tally -------------------------------------------
  setTallyTrialState: (v) => set({ tallyTrialState: v }),
  weighSack: (i) => {
    const s = get();
    if (s.tallyTrialState !== "assigned") return;
    if (s.sacksWeighed[i]) return;
    const next = [...s.sacksWeighed];
    next[i] = true;
    set({ sacksWeighed: next, tallyTrialState: next.every(Boolean) ? "inspected" : s.tallyTrialState });
  },

  // ---- Trial 9: The Muster ------------------------------------------------
  setMusterTrialState: (v) => set({ musterTrialState: v }),
  /** Thorn calls three moves; each correct answer advances the drill. */
  advanceMuster: () => {
    const s = get();
    if (s.musterTrialState !== "assigned") return;
    const step = s.musterStep + 1;
    set({ musterStep: step, musterTrialState: step >= 3 ? "inspected" : s.musterTrialState });
  },

  // ---- Trial 10: The Scrap in the Quarry ----------------------------------
  setScrapTrialState: (v) => set({ scrapTrialState: v }),
  damageScrap: (i, dmg) => {
    const s = get();
    if (s.scrapTrialState !== "assigned") return;
    const hp = [...s.scrapHealth];
    hp[i] = Math.max(0, hp[i] - dmg);
    const cleared = hp.every((h) => h <= 0);
    set({ scrapHealth: hp, scrapTrialState: cleared ? "inspected" : s.scrapTrialState });
  },

  damageDummy: (index: number, dmg: number) => {
    const s = get();
    // The dummies only count once the Council has actually set the blade trial.
    // Without this guard a player could wander behind the Blue House at minute one,
    // fell all three, flip combatTrialState to "completed", collect their father's
    // blade and walk into the cave — skipping every trial before it.
    //
    // This is now one instance of a general rule rather than a special case: the
    // quest spine in quests.ts decides what is reachable, and every gate asks it.
    if (s.combatTrialState !== "assigned") return;
    const nextH = [...s.dummiesHealth];
    nextH[index] = Math.max(0, nextH[index] - dmg);
    const allDefeated = nextH.every((h) => h <= 0);
    set({ dummiesHealth: nextH, combatTrialState: allDefeated ? "completed" : s.combatTrialState });
  },

  setCaveStage: (v) => set({ caveStage: v }),

  damageBoss: (dmg) => {
    const s = get();
    if (s.caveStage !== "boss_awake") return;
    const hp = Math.max(0, s.bossHp - dmg);
    if (hp <= 0) {
      set({ bossHp: 0, caveStage: "boss_defeated" });
      sfx.questComplete();
      get().showDialog(caveBossDefeatedDialog, "bossDefeated");
    } else {
      set({ bossHp: hp });
    }
  },

  hurt: (dmg) => {
    const s = get();
    if (rt.player.invuln > 0 || rt.player.dodgeIframes > 0) return;
    const applied = rt.player.blocking ? Math.ceil(dmg * 0.5) : dmg;
    rt.player.invuln = 1.0;
    const hp = s.hp - applied;
    if (hp <= 0) {
      // the life suit's failsafe returns fallen wanderers to the Safe Camp;
      // the machine keeps its wounds — defeated enemies remain defeated
      window.dispatchEvent(new CustomEvent("minslaire:death"));
      set({ hp: 100, carryingBody: false, currentArea: "home", currentInterior: "home" });
      rt.player.pos.set(72.5 + 4.5, 2, 75 + 5.5);
      rt.player.yaw = Math.PI;
      get().showDialog(lifeSuitRespawnDialog, "lifeSuitRespawn");
    } else {
      set({ hp });
    }
  },

  advanceDialog: () => {
    const s = get();
    if (!s.activeDialog) return;
    if (s.activeDialog.index < s.activeDialog.lines.length - 1) {
      set({ activeDialog: { ...s.activeDialog, index: s.activeDialog.index + 1 } });
      if (s.memoryActive) set({ memoryIndex: s.activeDialog.index + 1 });
    } else {
      // finished
      const src = s.dialogSourceId;
      const wasMemory = src === "fatherMemory";
      const wasTinslaireInside = src === "tinslaireInside";
      const wasMossDoor = src === "elderMossDoor";
      const wasWellInspect = src === "wellInspect";
      const wasMossWellIntro = src === "elderMossWellIntro";
      const wasMossWellReport = src === "elderMossWellReport";
      const wasSageStudyIntro = src === "elderSageStudyIntro";
      const wasScholarDeskClue = src === "scholarDeskClue";
      const wasSageStudyDeliver = src === "elderSageStudyDeliver";
      const wasThornIntro = src === "elderThornIntro";
      const wasGrainPickup = src === "gardenGrainPickup";
      const wasWidowDeliver = src === "widowDeliverFlow";
      const wasMinslaireDecline = src === "minslaireDecline";
      const wasWidowBlessedFinal = src === "widowBlessedFinal";
      const wasThornComplete = src === "elderThornComplete";
      const wasTraderIntro = src === "traderIntro";
      const wasTraderReturn = src === "traderReturn";
      const wasCouncilCombat = src === "councilCombatTrial";
      const wasSwordTaken = src === "swordTaken";
      const wasCaveEnter = src === "caveEnter";
      const wasBodyLift = src === "bodyLift";
      const wasForgeDeliver = src === "forgeDeliver";

      const next: Partial<ElderState> = { activeDialog: null, dialogSourceId: null };
      if (wasMemory) { next.memoryActive = false; next.memoryDone = true; next.openingBlack = false; }
      if (wasSwordTaken) { next.hasSword = true; }
      if (wasCaveEnter) {
        next.currentArea = "cave";
        next.currentInterior = "cave";
        if (s.caveStage === "not_entered") next.caveStage = "entered";
        // step into the cavern, just north of the entrance mat
        rt.player.pos.set(72.5 + 7 + 0.5, 2, 75 + 19 + 0.5);
        rt.player.yaw = Math.PI;
      }
      if (wasBodyLift) { next.carryingBody = true; }
      if (wasForgeDeliver) { next.carryingBody = false; next.hasCompass = true; next.caveStage = "delivered"; }
      if (wasTinslaireInside) { next.tinslaireInsideTalked = true; next.eldersAtDoorReady = true; }
      if (wasMossDoor) { next.eldersDoorDialogDone = true; }
      if (wasMossWellIntro) { next.wellTrialState = "assigned"; }
      if (wasWellInspect) { next.wellTrialState = "inspected"; }
      if (wasMossWellReport) { next.wellTrialState = "completed"; }
      if (wasSageStudyIntro) { next.scholarTrialState = "assigned"; }
      if (wasScholarDeskClue && (s.scholarTrialState === "assigned" || s.scholarTrialState === "not_started")) {
        next.scholarTrialState = "desk_read";
      }
      if (wasSageStudyDeliver) { next.scholarTrialState = "completed"; }
      if (wasThornIntro) { next.widowTrialState = "assigned"; }
      if (wasGrainPickup) { next.widowTrialState = "grain_picked"; next.carryingGrain = true; }
      if (wasWidowDeliver) { next.carryingGrain = false; }
      if (wasThornComplete) { next.widowTrialState = "completed"; }
      if (wasTraderIntro) { next.marketTrialState = "overpaid"; }
      if (wasTraderReturn) { next.marketTrialState = "completed"; }
      if (wasCouncilCombat) { next.combatTrialState = "assigned"; }

      // --- Trials 5-10 -------------------------------------------------------
      // Each trial assigns on its intro dialog and completes on its report-back
      // dialog. The middle ("inspected") state is set by the interaction itself
      // (lighting braziers, cycling sluices, weighing sacks, felling constructs),
      // not here, so the player has to actually perform the verb.
      if (src === "watchIntro") { next.watchTrialState = "assigned"; }
      if (src === "watchComplete") { next.watchTrialState = "completed"; }
      if (src === "sluiceIntro") { next.sluiceTrialState = "assigned"; }
      if (src === "sluiceComplete") { next.sluiceTrialState = "completed"; }
      if (src === "blightIntro") { next.blightTrialState = "assigned"; }
      if (src === "blightComplete") { next.blightTrialState = "completed"; }
      if (src === "tallyIntro") { next.tallyTrialState = "assigned"; }
      if (src === "tallyComplete") { next.tallyTrialState = "completed"; }
      if (src === "musterIntro") { next.musterTrialState = "assigned"; }
      if (src === "musterComplete") { next.musterTrialState = "completed"; }
      if (src === "scrapIntro") { next.scrapTrialState = "assigned"; }
      if (src === "scrapComplete") { next.scrapTrialState = "completed"; }

      if (src) {
        const ns = new Set(s.spoken); ns.add(src);
        (next as any).spoken = ns;
      }
      set(next as any);

      // chained beats — the Widow's reward, honorably refused, then her blessing
      if (wasWidowDeliver) {
        get().showDialog(minslaireDeclineRewardDialog, "minslaireDecline");
      } else if (wasMinslaireDecline) {
        get().showDialog(widowOrenBlessedDialog, "widowBlessedFinal");
      } else if (wasWidowBlessedFinal) {
        set({ widowTrialState: "delivered" });
      }
    }
  },
  setArea: (area, interior) => set({ currentArea: area, currentInterior: interior }),
  setOpeningBlack: (v) => set({ openingBlack: v }),
}));
