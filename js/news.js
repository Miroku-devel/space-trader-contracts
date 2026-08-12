// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const POLITICS_HEADLINES = {
  Anarchy: [
    "Riots, Looting Mar Factional Negotiations.",
    "Communities Seek Consensus.",
    "Successful Bakunin Day Rally!",
    "Major Faction Conflict Expected for the Weekend!",
    "Warlords Declare Autonomous Zones Across Sector!",
    "Public Utilities Seized by Local Militias!",
    "No Authority Too Small to Overthrow.",
    "Rival Gang Truce Holds for Third Week.",
    "Committee Formed to Form Another Committee.",
  ],
  Capitalist: [
    "Editorial: Taxes Too High!",
    "Market Indices Read Record Levels!",
    "Corporate Profits Up!",
    "Restrictions on Corporate Freedom Abolished by Courts!",
    "Deregulation Bill Promises Economic Boom!",
    "Stock Exchange Sets New All-Time High!",
    "Inheritance Tax Elimination Proposed.",
    "Startup Valuation Reaches Billion Credit Milestone.",
    "CEO Caught Counting Money; Applauded for Work Ethic.",
  ],
  Communist: [
    "Party Reports Productivity Increase.",
    "Counter-Revolutionary Bureaucrats Purged from Party!",
    "Party: Bold New Future Predicted!",
    "Politburo Approves New 5-Year Plan!",
    "Collective Farm Yields Exceed Targets!",
    "Central Planning Committee Announces Surplus!",
    "Volunteer Labor Drive Exceeds Expectations.",
    "Factory Output Quotas Revised Upward.",
    "All Citizens Now Equally Productive, Party Says.",
  ],
  Confederacy: [
    "States Dispute Natural Resource Rights!",
    "States Denied Federal Funds over Local Laws!",
    "Southern States Resist Federal Taxation for Capital Projects!",
    "States Request Federal Intervention in Citrus Conflict!",
    "Secession Talks Intensify Among Border States!",
    "Interstate Trade Dispute Threatens Coalition!",
    "Governor Refuses to Enforce Federal Mandate.",
    "Regional Border Skirmish Escalates.",
    "Neighbouring State Installs Slightly Taller Flagpole.",
  ],
  Corporate: [
    "Robot Shortages Predicted for Q4.",
    "Profitable Quarter Predicted.",
    "CEO: Corporate Rebranding Progressing.",
    "Advertising Budgets to Increase.",
    "Quarterly Bonuses Announced for All Executives!",
    "Merger Talks Between Megacorps Break Down!",
    "New Subsidiary Spin-Off Announced for Q1.",
    "Shareholder Meeting Turns Heated Over Pay Disparity.",
    "Company Introduces Free Fridays; Takes Them Away Monday.",
  ],
  Cybernetic: [
    "Olympics: Software Beats Wetware in All Events!",
    "New Network Protocols To Be Deployed.",
    "Storage Banks to be Upgraded!",
    "System Backup Rescheduled.",
    "Neural Interface Implants Reach 90% Adoption!",
    "AI Rights Debate Heats Up After Sentience Breakthrough!",
    "Cybernetic Organ Transplants Now Routine.",
    "Data Privacy Laws Tightened After Major Breach.",
    "Robot Chef Refuses to Make Anything but Toast.",
  ],
  Democracy: [
    "Local Elections on Schedule!",
    "Polls: Voter Satisfaction High!",
    "Campaign Spending Aids Economy!",
    "Police, Politicians Vow Improvements.",
    "Bipartisan Infrastructure Bill Passes!",
    "Public Hearing on Police Reform Draws Crowds!",
    "Recall Petition Gains Enough Signatures.",
    "Senate Filibuster Blocks Key Legislation.",
    "Politician Caught Promising Same Thing to Both Sides.",
  ],
  Dictatorship: [
    "New Palace Planned; Taxes Increase.",
    "Future Presents More Opportunities for Sacrifice!",
    "Insurrection Crushed: Rebels Executed!",
    "Police Powers to Increase!",
    "Dissident Roundup Yields Mass Arrests!",
    "Propaganda Ministry Launches New Loyalty Campaign!",
    "Rival Faction Leader Found Dead in Cell.",
    "Secret Police Expanded Under New Decree.",
    "Mandatory Cheerfulness Law Passes Unanimously!",
  ],
  Fascist: [
    "Drug Smugglers Sentenced to Death!",
    "Aliens Required to Carry Visible Identification at All Times!",
    "Foreign Sabotage Suspected.",
    "Stricter Immigration Laws Installed.",
    "National Purity Laws Strengthened!",
    "Mandatory Patriotism Education Enacted!",
    "Minority Neighborhoods Scheduled for Relocation.",
    "Political Prisoner Count Reaches All-Time High.",
    "Citizen Reporting Forms Now Require Pre-Approval.",
  ],
  Feudal: [
    "Farmers Drafted to Defend Lord's Castle!",
    "Report: Kingdoms Near Flashpoint!",
    "Baron Ignores Ultimatum!",
    "War of Succession Threatens!",
    "Duke Challenges Crown for Throne!",
    "Peasant Rebellion Quelled by Lord's Knights!",
    "Plague Sweeps Through Serf Quarters.",
    "Castle Fortifications Deemed Inadequate by Advisor.",
    "Dragon Spotted; Entire Harvest Left to Rot.",
  ],
  Military: [
    "Court-Martials Up 2% This Year.",
    "Editorial: Why Wait to Invade?",
    "HQ: Invasion Plans Reviewed.",
    "Weapons Research Increases Kill-Ratio!",
    "New Battleship Commissioned for Sector Defense!",
    "Conscription Age Lowered Amid Rising Tensions!",
    "Troop Surge Announced for Border Conflict.",
    "Veterans Group Demands Better Benefits Package.",
    "General Loses War; Promoted to Desk Job.",
  ],
  Monarchy: [
    "King to Attend Celebrations.",
    "Queen's Birthday Celebration Ends in Riots!",
    "King Commissions New Artworks.",
    "Prince Exiled for Palace Plot!",
    "Royal Heir Announced; Succession Secured!",
    "Nobles Demand Lower Tributes from Serfs!",
    "Jester Insults King, Escapes Punishment.",
    "Ambassador Recalled Over Diplomatic Dispute.",
    "Royal Chef Resigns Over Peas Disagreement.",
  ],
  Pacifist: [
    "Dialog Averts Eastern Conflict!",
    "Universal Peace: Is it Possible?",
    "Editorial: Life in Harmony.",
    "Polls: Happiness Quotient High!",
    "Disarmament Treaty Signed by Rival Factions!",
    "Peace March Draws Record Participation!",
    "Mediation Offer Accepted by Warring States.",
    "Cultural Exchange Program Launched Between Sectors.",
    "Group Meditation Record Set; Participants Too Peaceful to Care.",
  ],
  Socialist: [
    "Government Promises Increased Welfare Benefits!",
    "State Denies Food Rationing Required to Prevent Famine.",
    "'Welfare Actually Boosts Economy,' Minister Says.",
    "Hoarder Lynched by Angry Mob!",
    "Workers' Council Demands Greater Representation!",
    "Housing Cooperative Model Declared a Success!",
    "Price Controls Reintroduced on Essential Goods.",
    "Public Transit Expansion Project Receives Funding.",
    "Bread Subsidy Extended; Croissant Sales Plummet.",
  ],
  Technocracy: [
    "New Processor Hits 10 ZettaHerz!",
    "Nanobot Output Exceeds Expectation.",
    "Last Human Judge Retires.",
    "Software Bug Causes Mass Confusion.",
    "Automation Reaches 95% of All Industries!",
    "Universal Basic Income Pilot Program Approved!",
    "Data Center Cooling Costs Exceed City Budget.",
    "Quantum Computing Milestone Achieved by Research Team.",
    "AI Declares Philosophy Solved; Nobody Understands the Proof.",
  ],
  Theocracy: [
    "High Priest to Hold Special Services.",
    "Temple Restoration Fund at 81%.",
    "Sacred Texts on Public Display.",
    "Dozen Blasphemers Excommunicated!",
    "Crusade Called Against Heathen Worlds!",
    "Temple Inquisition Investigates Heretical Texts!",
    "Pilgrimage Route Declared Safe After Raids.",
    "Miracle Cure Claims Investigated by Temple Scholars.",
    "Prayer Mat Sales Up; Knees Down, Say Analysts.",
  ],
};
function setNewsText(el, html) {
  el.innerHTML = html;
  el.style.animation = "none";
  void el.offsetHeight;
  var n = (html.match(/news-headline/g) || []).length || 1;
  el.style.animation = "news-ticker " + n * 8 + "s linear infinite";
}
function updateNewsLabel() {
  var text = getNewsHeadline();
  var label = document.getElementById("news-label-text");
  var hudLabel = document.getElementById("hud-news-label-text");
  if (label) setNewsText(label, text);
  if (hudLabel) setNewsText(hudLabel, text);
}
const SYSTEM_STATUS_HEADLINES = [
  null, "War News: Offensives Continue!", "Plague Spreads! Outlook Grim.",
  "No Rain in Sight", "Editors: Won't Someone Entertain Us?",
  "Cold Snap Continues!", "Serious Crop Failure! Must We Ration?",
  "Jobless Rate at All-Time Low!",
];
const HERO_HEADLINES = [
  "Locals Welcome Visiting Hero {Commander}!",
  "Famed Hero {Commander} to Visit System!",
  "Large Turnout At Spaceport to Welcome {Commander}!",
];
const VILLAIN_HEADLINES = [
  "Police Warning: {Commander} Will Dock at {System}!",
  "Notorious Criminal {Commander} Sighted in {System}!",
  "Locals Rally to Deny Spaceport Access to {Commander}!",
  "Terror Strikes Locals on Arrival of {Commander}!",
];
const DYNAMIC_PREFIXES = [
  "Reports of", "News of", "New Rumors of", "Sources say",
  "Evidence Suggests",
];
const STATUS_NEWS_STR = [
  null, "Strife and War", "Plague Outbreaks", "Severe Drought",
  "Terrible Boredom", "Cold Weather", "Crop Failures", "Labor Shortages",
];
function getNewsHeadline() {
  if (typeof currentStar === "undefined" || !currentStar || !currentStar.system)
    return "Breaking News";
  var politics = currentStar.system;
  var headlines = POLITICS_HEADLINES[politics];
  var mastheads = POLITICS_MASTHEADS[politics];
  if (!headlines || !headlines.length) return "Breaking News";
  var shuffled = headlines.slice().sort(function () {
    return Math.random() - 0.5;
  });
  var shuffledMastheads =
    mastheads && mastheads.length
      ? mastheads.slice().sort(function () {
          return Math.random() - 0.5;
        })
      : null;
  var items = [];
  for (var pi = 0; pi < Math.min(5, shuffled.length); pi++) {
    var m =
      shuffledMastheads && shuffledMastheads.length
        ? shuffledMastheads[pi % shuffledMastheads.length].replace(
            "{star}",
            currentStar.name,
          )
        : null;
    items.push(
      m
        ? '<span class="news-masthead">' +
            m +
            ' |</span><span class="news-headline"> ' +
            shuffled[pi] +
            "</span>"
        : shuffled[pi],
    );
  }
  if (currentStar.status && currentStar.status !== 0) {
    var statusHL = SYSTEM_STATUS_HEADLINES[currentStar.status];
    if (statusHL) {
      var sm =
        mastheads && mastheads.length
          ? mastheads[Math.floor(Math.random() * mastheads.length)].replace(
              "{star}",
              currentStar.name,
            )
          : null;
      items.push(
        sm
          ? '<span class="news-masthead">' +
              sm +
              ' |</span><span class="news-headline"> ' +
              statusHL +
              "</span>"
          : statusHL,
      );
    }
  }
  if (typeof policeRecordScore !== "undefined" && policeRecordScore >= 75) {
    var heroHL =
      HERO_HEADLINES[Math.floor(Math.random() * HERO_HEADLINES.length)];
    var sm =
      mastheads && mastheads.length
        ? mastheads[Math.floor(Math.random() * mastheads.length)].replace(
            "{star}",
            currentStar.name,
          )
        : null;
    heroHL = heroHL.replace(
      /\{Commander\}/g,
      window.commanderName || "Commander",
    );
    items.push(
      sm
        ? '<span class="news-masthead">' +
            sm +
            ' |</span><span class="news-headline"> ' +
            heroHL +
            "</span>"
        : heroHL,
    );
  }
  if (typeof policeRecordScore !== "undefined" && policeRecordScore <= -70) {
    var villainHL =
      VILLAIN_HEADLINES[Math.floor(Math.random() * VILLAIN_HEADLINES.length)];
    var sm =
      mastheads && mastheads.length
        ? mastheads[Math.floor(Math.random() * mastheads.length)].replace(
            "{star}",
            currentStar.name,
          )
        : null;
    villainHL = villainHL
      .replace(/\{Commander\}/g, window.commanderName || "Commander")
      .replace(/\{System\}/g, currentStar.name);
    items.push(
      sm
        ? '<span class="news-masthead">' +
            sm +
            ' |</span><span class="news-headline"> ' +
            villainHL +
            "</span>"
        : villainHL,
    );
  }
  if (
    typeof stars !== "undefined" &&
    stars &&
    stars.length > 1 &&
    typeof travelDistance === "function"
  ) {
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];
      if (
        s !== currentStar &&
        s.status &&
        s.status !== 0 &&
        travelDistance(currentStar, s) <= 20
      ) {
        var prefix =
          DYNAMIC_PREFIXES[Math.floor(Math.random() * DYNAMIC_PREFIXES.length)];
        var statusStr = STATUS_NEWS_STR[s.status];
        if (statusStr) {
          var text =
            prefix + " " + statusStr + " in the " + s.name + " System.";
          items.push(
            '<span class="news-masthead">Interstellar Dispatch |</span><span class="news-headline"> ' +
              text +
              "</span>",
          );
        }
      }
    }
  }
  items.sort(function () {
    return Math.random() - 0.5;
  });
  return items.slice(0, 10).join("");
}
const POLITICS_MASTHEADS = {
  Anarchy: ["The {star} Arsenal", "The Grassroot", "Kick It!"],
  Capitalist: ["The Objectivist", "The {star} Market", "The Invisible Hand"],
  Communist: ["The Daily Worker", "The People's Voice", "The {star} Proletariat"],
  Confederacy: ["Planet News", "The {star} Times", "Interstate Update"],
  Corporate: ["{star} Memo", "News From The Board", "Status Report"],
  Cybernetic: ["Pulses", "Binary Stream", "The System Clock"],
  Democracy: ["The Daily Planet", "The {star} Majority", "Unanimity"],
  Dictatorship: ["The Command", "Leader's Voice", "The {star} Mandate"],
  Fascist: ["State Tribune", "Motherland News", "Homeland Report"],
  Feudal: ["News from the Keep", "The Town Crier", "The {star} Herald"],
  Military: ["General Report", "{star} Dispatch", "The {star} Sentry"],
  Monarchy: ["Royal Times", "The Loyal Subject", "The Fanfare"],
  Pacifist: ["Pax Humani", "Principle", "The {star} Chorus"],
  Socialist: ["All for One", "Brotherhood", "The People's Syndicate"],
  Technocracy: ["The Future", "Hardware Dispatch", "TechNews"],
  Theocracy: ["The Spiritual Advisor", "Church Tidings", "The Temple Tribune"],
};
