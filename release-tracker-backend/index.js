const express = require("express");
const PORT = process.env.PORT || 5000;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`;
const JSONBIN_SECRET = process.env.JSONBIN_SECRET;

// ─────────────────────────────────────────────
// Read / Write via JSONBin
// ─────────────────────────────────────────────
async function readData() {
  const res = await fetch(JSONBIN_URL + "/latest", {
    headers: { "X-Master-Key": JSONBIN_SECRET },
  });
  const json = await res.json();
  return json.record;
}

async function writeData(data) {
  await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_SECRET,
    },
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────
// Semver comparison: returns true if a > b
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
  return false;
}

// ─────────────────────────────────────────────
// Track running jobs (prevent double-execution)
// ─────────────────────────────────────────────
const runningJobs = new Set();

// ─────────────────────────────────────────────
// Poller — checks every 10s for due upgrades
// ─────────────────────────────────────────────
function startSchedulerPoller() {
  setInterval(async () => {
    try {
      const data = await readData();
      const now = new Date();

      for (const client of data.clients) {
        for (let idx = 0; idx < client.upgrades.length; idx++) {
          const upgrade = client.upgrades[idx];
          if (upgrade.status !== "Scheduled") continue;

          const scheduledDate = new Date(upgrade.scheduledAt);
          if (scheduledDate > now) continue;

          const jobKey = `${client.id}:${idx}`;
          if (runningJobs.has(jobKey)) continue;

          console.log(`[POLLER] Firing upgrade for "${client.name}" (index ${idx})`);
          runDeployment(client.id, idx);
        }
      }
    } catch (e) {
      console.error("[POLLER] Error:", e.message);
    }
  }, 10_000);
}

// ─────────────────────────────────────────────
// Self-ping to prevent Render sleep
// ─────────────────────────────────────────────
function startPinger() {
  setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    fetch(`${url}/ping`)
      .then(() => console.log("[PING] alive"))
      .catch((e) => console.log("[PING] failed:", e.message));
  }, 14 * 60 * 1000);
}

// ─────────────────────────────────────────────
// GET /ping
// ─────────────────────────────────────────────
app.get("/ping", (req, res) => res.send("ok"));

// ─────────────────────────────────────────────
// GET /clients
// ─────────────────────────────────────────────
app.get("/clients", async (req, res) => {
  try {
    const data = await readData();
    res.json(data.clients);
  } catch (e) {
    res.status(500).send("Failed to read data");
  }
});

// ─────────────────────────────────────────────
// GET /builds
// ─────────────────────────────────────────────
app.get("/builds", async (req, res) => {
  try {
    const data = await readData();
    res.json(data.availableBuilds);
  } catch (e) {
    res.status(500).send("Failed to read data");
  }
});

// ─────────────────────────────────────────────
// POST /schedule-upgrade
// ─────────────────────────────────────────────
app.post("/schedule-upgrade", async (req, res) => {
  const { clientId, toVersion, scheduledBy, scheduledAt } = req.body;

  if (!clientId || !toVersion || !scheduledBy || !scheduledAt)
    return res.status(400).send("All fields are required");

  try {
    const data = await readData();

    if (!data.availableBuilds.includes(toVersion))
      return res.status(400).send(`Invalid build version: ${toVersion}`);

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()))
      return res.status(400).send("Invalid scheduledAt date");

    const client = data.clients.find((c) => c.id == clientId);
    if (!client) return res.status(404).send("Client not found");

    if (toVersion === client.currentVersion)
      return res.status(400).send(`Client is already on version ${toVersion}`);

    if (!isHigher(toVersion, client.currentVersion))
      return res.status(400).send(
        `Cannot downgrade. Client is on ${client.currentVersion}, target is ${toVersion}`
      );

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
    await writeData(data);

    if (scheduledDate <= new Date()) {
      runDeployment(clientId, upgradeIndex);
    } else {
      console.log(`[SCHEDULED] "${client.name}" → ${toVersion} at ${scheduledDate}`);
    }

    res.json(upgrade);
  } catch (e) {
    res.status(500).send("Failed to schedule upgrade");
  }
});

// ─────────────────────────────────────────────
// GET /logs/:clientId
// ─────────────────────────────────────────────
app.get("/logs/:clientId", async (req, res) => {
  try {
    const data = await readData();
    const client = data.clients.find((c) => c.id == req.params.clientId);
    if (!client) return res.status(404).send("Client not found");
    res.json(client.upgrades);
  } catch (e) {
    res.status(500).send("Failed to read logs");
  }
});

// ─────────────────────────────────────────────
// Deployment Simulation
// ─────────────────────────────────────────────
async function runDeployment(clientId, upgradeIndex) {
  const jobKey = `${clientId}:${upgradeIndex}`;
  if (runningJobs.has(jobKey)) return;
  runningJobs.add(jobKey);

  try {
    let data = await readData();
    let client = data.clients.find((c) => c.id == clientId);

    if (!client || !client.upgrades[upgradeIndex]) {
      console.error(`runDeployment: Cannot find client ${clientId} or upgrade ${upgradeIndex}`);
      runningJobs.delete(jobKey);
      return;
    }

    client.upgrades[upgradeIndex].status = "In Progress";
    client.upgrades[upgradeIndex].logs.push({
      time: new Date(),
      message: "Deployment started",
    });
    await writeData(data);

    const steps = [
      "Fetching build artifact",
      "Running DB migrations",
      "Restarting application services",
      "Performing health check",
    ];

    for (const step of steps) {
      await delay(2000);
      data = await readData();
      client = data.clients.find((c) => c.id == clientId);
      client.upgrades[upgradeIndex].logs.push({ time: new Date(), message: step });
      await writeData(data);
    }

    await delay(2000);
    data = await readData();
    client = data.clients.find((c) => c.id == clientId);
    const upgrade = client.upgrades[upgradeIndex];

    if (Math.random() < 0.2) {
      upgrade.status = "Failed";
      upgrade.logs.push({ time: new Date(), message: "Deployment failed — rolling back" });
    } else {
      upgrade.status = "Completed";
      upgrade.logs.push({ time: new Date(), message: "Deployment completed successfully" });
      client.currentVersion = upgrade.toVersion;
    }

    await writeData(data);
    console.log(`[DONE] Client ${clientId} upgrade → ${upgrade.status}`);
  } catch (e) {
    console.error("[DEPLOY] Error:", e.message);
  } finally {
    runningJobs.delete(jobKey);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("Starting scheduler poller (10s interval)...");
  startSchedulerPoller();
  startPinger();
});