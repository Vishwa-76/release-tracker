const fs = require("fs");

const namePrefixes = [
  "Nexora", "BluePeak", "Orion", "Vertex", "Silverline",
  "Horizon", "Apex", "Quantum", "Nova", "BrightBridge",
  "TitanEdge", "PrimeAxis", "CoreWave", "Skyline", "FusionNet",
  "ElitePath", "SummitCore", "Velocity", "Infinity", "NorthStar"
];

const nameSuffixes = [
  "Solutions", "Technologies", "Systems", "Financial Group",
  "HealthCare", "Retail Corp", "Insurance Ltd",
  "Logistics", "Medical", "Consulting",
  "Enterprises", "Global Services", "Data Systems"
];

const versions = [
  "7.18.2.0",
  "7.19.4.0",
  "7.20.1.0",
  "7.21.7.0",
  "7.22.8.0",
  "7.23.3.0",
  "7.24.2.0",
  "7.25.4.0"
];

const clients = [];

for (let i = 1; i <= 100; i++) {
  const randomPrefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
  const randomSuffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];

  clients.push({
    id: i,
    name: `${randomPrefix} ${randomSuffix}`,
    currentVersion: randomVersion,
    upgrades: []
  });
}

const data = {
  clients,
  availableBuilds: [
    "7.26.1.0",
    "7.26.2.0",
    "7.27.0.0",
    "7.27.1.0",
    "7.28.0.0"
  ],
  applications: []
};

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

console.log("100 Realistic Clients Generated");