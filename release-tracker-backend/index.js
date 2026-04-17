const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ─────────────────────────────────────────────
// On server START: check for any upgrades that
// were "Scheduled" but missed (server was off).
// Mark them Failed, then re-register future ones.
// ─────────────────────────────────────────────
function restoreScheduledJobs() {
  const data = readData();
  const now = new Date();
  let dirty = false;

  data.clients.forEach(client => {
    client.upgrades.forEach((upgrade, idx) => {
      if (upgrade.status !== "Scheduled") return;

      const scheduledDate = new Date(upgrade.scheduledAt);

      if (scheduledDate <= now) {
        // Missed — server was offline during the scheduled window
        console.log(`[MISSED] Client "${client.name}" upgrade at ${scheduledDate} — marking Failed`);
        upgrade.status = "Failed";
        upgrade.logs.push({
          time: new Date(),
          message: "Server was offline during scheduled window — upgrade could not run"
        });
        dirty = true;
      } else {
        // Future job — re-register it
        console.log(`[RESTORE] Scheduling job for client "${client.name}" at ${scheduledDate}`);
        schedule.scheduleJob(scheduledDate, () => runDeployment(client.id, idx));
      }
    });
  });

  if (dirty) writeData(data);
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

  // Validation
  if (!clientId || !toVersion || !scheduledBy || !scheduledAt) {
    return res.status(400).send("All fields (clientId, toVersion, scheduledBy, scheduledAt) are required");
  }

  const data = readData();

  if (!data.availableBuilds.includes(toVersion)) {
    return res.status(400).send(`Invalid build version: ${toVersion}`);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return res.status(400).send("Invalid scheduledAt date");
  }

  const client = data.clients.find(c => c.id == clientId);
  if (!client) return res.status(404).send("Client not found");

  if (toVersion === client.currentVersion) {
  return res.status(400).send(`Client is already on version ${toVersion}`);
  }

  const toVerParts = toVersion.split(".").map(Number);
  const curVerParts = client.currentVersion.split(".").map(Number);
  const isDowngrade = toVerParts.every((v, i) => v <= curVerParts[i]);

  if (isDowngrade) {
    return res.status(400).send(`Cannot schedule a downgrade. Client is on ${client.currentVersion}, target is ${toVersion}`);
  }
  
  const upgrade = {
    fromVersion: client.currentVersion,
    toVersion,
    scheduledBy,
    scheduledAt,
    status: "Scheduled",
    logs: [
      { time: new Date(), message: `Upgrade scheduled by ${scheduledBy} for ${scheduledDate.toLocaleString()}` }
    ]
  };

  client.upgrades.push(upgrade);
  const upgradeIndex = client.upgrades.length - 1;
  writeData(data);

  if (scheduledDate <= new Date()) {
    // Past/immediate — run right away
    runDeployment(clientId, upgradeIndex);
  } else {
    // Schedule with node-schedule (survives as long as server is up)
    schedule.scheduleJob(scheduledDate, () => runDeployment(clientId, upgradeIndex));
    console.log(`[SCHEDULED] Client "${client.name}" → ${toVersion} at ${scheduledDate}`);
  }

  res.json(upgrade);
});

// ─────────────────────────────────────────────
// GET /logs/:clientId
// ─────────────────────────────────────────────
app.get("/logs/:clientId", (req, res) => {
  const client = readData().clients.find(c => c.id == req.params.clientId);
  if (!client) return res.status(404).send("Client not found");
  res.json(client.upgrades);
});

// ─────────────────────────────────────────────
// Deployment Simulation
// ─────────────────────────────────────────────
function runDeployment(clientId, upgradeIndex) {
  // Read fresh data before starting
  let data = readData();
  let client = data.clients.find(c => c.id == clientId);

  if (!client || !client.upgrades[upgradeIndex]) {
    console.error(`runDeployment: Cannot find client ${clientId} or upgrade index ${upgradeIndex}`);
    return;
  }

  client.upgrades[upgradeIndex].status = "In Progress";
  client.upgrades[upgradeIndex].logs.push({ time: new Date(), message: "Deployment started" });
  writeData(data);

  const steps = [
    "Fetching build artifact",
    "Running DB migrations",
    "Restarting application services",
    "Performing health check"
  ];

  let i = 0;
  const interval = setInterval(() => {
    // Always read fresh data to avoid overwriting concurrent changes
    data = readData();
    client = data.clients.find(c => c.id == clientId);
    const upgrade = client.upgrades[upgradeIndex];

    if (i < steps.length) {
      upgrade.logs.push({ time: new Date(), message: steps[i] });
      writeData(data);
      i++;
    } else {
      clearInterval(interval);
      if (Math.random() < 0.2) {
        upgrade.status = "Failed";
        upgrade.logs.push({ time: new Date(), message: "Deployment failed — rolling back" });
      } else {
        upgrade.status = "Completed";
        upgrade.logs.push({ time: new Date(), message: "Deployment completed successfully" });
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
app.listen(PORT, () => {
  console.log("Backend running on port 5000");
  console.log("Checking for missed or pending scheduled jobs...");
  restoreScheduledJobs();
});