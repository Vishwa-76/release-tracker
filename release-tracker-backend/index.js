const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ─────────────────────────────────────────────
// Semver comparison: returns true if `a` > `b`
// e.g. isHigher("7.20.0", "7.19.4") → true
// ─────────────────────────────────────────────
function isHigher(a, b) {
  const aParts = String(a).split(".").map(Number);
  const bParts = String(b).split(".").map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const av = aParts[i] ?? 0;
    const bv = bParts[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false; // equal
}

// ─────────────────────────────────────────────
// Track which upgrades are currently running
// (prevents double-execution in the poll loop)
// ─────────────────────────────────────────────
const runningJobs = new Set(); // keys: "clientId:upgradeIndex"

// ─────────────────────────────────────────────
// Poll every 10 seconds for due scheduled jobs.
// This is restart-safe — it reads from disk each
// time, so it works even after Render wakes up.
// ─────────────────────────────────────────────
function startSchedulerPoller() {
  setInterval(() => {
    const data = readData();
    const now = new Date();

    data.clients.forEach((client) => {
      client.upgrades.forEach((upgrade, idx) => {
        if (upgrade.status !== "Scheduled") return;

        const scheduledDate = new Date(upgrade.scheduledAt);
        if (scheduledDate > now) return; // not yet due

        const jobKey = `${client.id}:${idx}`;
        if (runningJobs.has(jobKey)) return; // already running

        console.log(
          `[POLLER] Firing upgrade for client "${client.name}" (index ${idx}) scheduled at ${scheduledDate}`
        );
        runDeployment(client.id, idx);
      });
    });
  }, 10_000); // check every 10 seconds
}

// ─────────────────────────────────────────────
// GET /clients
// ─────────────────────────────────────────────
app.get("/clients", (req, res) => {
  res.json(readData().clients);
});

// ─────────────────────────────────────────────
// GET /builds
// ─────────────────────────────────────────────
app.get("/builds", (req, res) => {
  res.json(readData().availableBuilds);
});

// ─────────────────────────────────────────────
// POST /schedule-upgrade
// ─────────────────────────────────────────────
app.post("/schedule-upgrade", (req, res) => {
  const { clientId, toVersion, scheduledBy, scheduledAt } = req.body;

  if (!clientId || !toVersion || !scheduledBy || !scheduledAt) {
    return res
      .status(400)
      .send("All fields (clientId, toVersion, scheduledBy, scheduledAt) are required");
  }

  const data = readData();

  if (!data.availableBuilds.includes(toVersion)) {
    return res.status(400).send(`Invalid build version: ${toVersion}`);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return res.status(400).send("Invalid scheduledAt date");
  }

  const client = data.clients.find((c) => c.id == clientId);
  if (!client) return res.status(404).send("Client not found");

  if (toVersion === client.currentVersion) {
    return res.status(400).send(`Client is already on version ${toVersion}`);
  }

  // Fixed semver check — uses proper comparison now
  if (!isHigher(toVersion, client.currentVersion)) {
    return res
      .status(400)
      .send(
        `Cannot schedule a downgrade. Client is on ${client.currentVersion}, target is ${toVersion}`
      );
  }

  const upgrade = {
    fromVersion: client.currentVersion,
    toVersion,
    scheduledBy,
    scheduledAt,
    status: "Scheduled",
    logs: [
      {
        time: new Date(),
        message: `Upgrade scheduled by ${scheduledBy} for ${scheduledDate.toLocaleString()}`,
      },
    ],
  };

  client.upgrades.push(upgrade);
  const upgradeIndex = client.upgrades.length - 1;
  writeData(data);

  // If the scheduled time is already in the past, run immediately.
  // Otherwise the poller will pick it up when the time comes.
  if (scheduledDate <= new Date()) {
    runDeployment(clientId, upgradeIndex);
  } else {
    console.log(
      `[SCHEDULED] Client "${client.name}" → ${toVersion} at ${scheduledDate} (poller will fire it)`
    );
  }

  res.json(upgrade);
});

// ─────────────────────────────────────────────
// GET /logs/:clientId
// ─────────────────────────────────────────────
app.get("/logs/:clientId", (req, res) => {
  const client = readData().clients.find((c) => c.id == req.params.clientId);
  if (!client) return res.status(404).send("Client not found");
  res.json(client.upgrades);
});

app.get("/ping", (req, res) => res.send("ok"));

setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  fetch(`${url}/ping`)
    .then(() => console.log("[PING] Server kept alive"))
    .catch((e) => console.log("[PING] Failed:", e.message));
}, 14 * 60 * 1000);
// ─────────────────────────────────────────────
// Deployment Simulation
// ─────────────────────────────────────────────
function runDeployment(clientId, upgradeIndex) {
  const jobKey = `${clientId}:${upgradeIndex}`;
  if (runningJobs.has(jobKey)) return; // guard against double-run
  runningJobs.add(jobKey);

  // Read fresh data before starting
  let data = readData();
  let client = data.clients.find((c) => c.id == clientId);

  if (!client || !client.upgrades[upgradeIndex]) {
    console.error(
      `runDeployment: Cannot find client ${clientId} or upgrade index ${upgradeIndex}`
    );
    runningJobs.delete(jobKey);
    return;
  }

  client.upgrades[upgradeIndex].status = "In Progress";
  client.upgrades[upgradeIndex].logs.push({
    time: new Date(),
    message: "Deployment started",
  });
  writeData(data);

  const steps = [
    "Fetching build artifact",
    "Running DB migrations",
    "Restarting application services",
    "Performing health check",
  ];

  let i = 0;
  const interval = setInterval(() => {
    data = readData();
    client = data.clients.find((c) => c.id == clientId);
    const upgrade = client.upgrades[upgradeIndex];

    if (i < steps.length) {
      upgrade.logs.push({ time: new Date(), message: steps[i] });
      writeData(data);
      i++;
    } else {
      clearInterval(interval);
      runningJobs.delete(jobKey);

      if (Math.random() < 0.2) {
        upgrade.status = "Failed";
        upgrade.logs.push({
          time: new Date(),
          message: "Deployment failed — rolling back",
        });
      } else {
        upgrade.status = "Completed";
        upgrade.logs.push({
          time: new Date(),
          message: "Deployment completed successfully",
        });
        client.currentVersion = upgrade.toVersion;
      }
      writeData(data);
      console.log(`[DONE] Client ${clientId} upgrade → ${upgrade.status}`);
    }
  }, 2000);
}

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("Starting scheduler poller (10s interval)...");
  startSchedulerPoller();
});