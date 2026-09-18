const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_FILE = path.join(__dirname, "data", "workflows.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to read workflow database
function readWorkflows() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading workflows.json:", err);
    return {};
  }
}

// Helper function to write workflow database
function writeWorkflows(workflows) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(workflows, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing workflows.json:", err);
    return false;
  }
}

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

// 1. GET /api/projects - List all projects with workflow metadata
app.get("/api/projects", (req, res) => {
  const workflows = readWorkflows();
  const projectList = Object.keys(workflows).map((key) => {
    const item = workflows[key];
    return {
      projectId: item.projectId,
      projectName: item.projectName,
      tagline: item.tagline,
      hasWorkflow: Array.isArray(item.steps) && item.steps.length > 0,
      stepCount: Array.isArray(item.steps) ? item.steps.length : 0,
    };
  });
  res.json({ success: true, count: projectList.length, data: projectList });
});

// 2. GET /api/projects/:projectId/workflow - Get specific project workflow
app.get("/api/projects/:projectId/workflow", (req, res) => {
  const { projectId } = req.params;
  const workflows = readWorkflows();

  if (!workflows[projectId]) {
    return res.status(404).json({
      success: false,
      message: `Workflow not found for project: ${projectId}`,
      data: null,
    });
  }

  res.json({
    success: true,
    projectId,
    data: workflows[projectId],
  });
});

// 3. POST /api/projects/:projectId/workflow - Create or full update of a project workflow
app.post("/api/projects/:projectId/workflow", (req, res) => {
  const { projectId } = req.params;
  const { projectName, tagline, description, steps } = req.body;

  if (!projectName || !Array.isArray(steps)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload. 'projectName' and 'steps' array are required.",
    });
  }

  const workflows = readWorkflows();
  workflows[projectId] = {
    projectId,
    projectName,
    tagline: tagline || "",
    description: description || "",
    steps: steps,
  };

  if (writeWorkflows(workflows)) {
    res.json({
      success: true,
      message: `Workflow for '${projectName}' updated successfully.`,
      data: workflows[projectId],
    });
  } else {
    res.status(500).json({ success: false, message: "Failed to save workflow database." });
  }
});

// 4. PUT /api/projects/:projectId/workflow/step/:stepId - Update a single step
app.put("/api/projects/:projectId/workflow/step/:stepId", (req, res) => {
  const { projectId, stepId } = req.params;
  const stepUpdates = req.body;

  const workflows = readWorkflows();
  if (!workflows[projectId] || !Array.isArray(workflows[projectId].steps)) {
    return res.status(404).json({ success: false, message: "Project workflow not found." });
  }

  const stepIndex = workflows[projectId].steps.findIndex((s) => s.stepId === stepId);
  if (stepIndex === -1) {
    return res.status(404).json({ success: false, message: `Step ID '${stepId}' not found.` });
  }

  // Merge updates
  workflows[projectId].steps[stepIndex] = {
    ...workflows[projectId].steps[stepIndex],
    ...stepUpdates,
  };

  if (writeWorkflows(workflows)) {
    res.json({
      success: true,
      message: `Step '${stepId}' updated successfully.`,
      data: workflows[projectId].steps[stepIndex],
    });
  } else {
    res.status(500).json({ success: false, message: "Failed to save step updates." });
  }
});

// 5. DELETE /api/projects/:projectId/workflow/step/:stepId - Delete a step
app.delete("/api/projects/:projectId/workflow/step/:stepId", (req, res) => {
  const { projectId, stepId } = req.params;

  const workflows = readWorkflows();
  if (!workflows[projectId] || !Array.isArray(workflows[projectId].steps)) {
    return res.status(404).json({ success: false, message: "Project workflow not found." });
  }

  const initialLength = workflows[projectId].steps.length;
  workflows[projectId].steps = workflows[projectId].steps.filter((s) => s.stepId !== stepId);

  if (workflows[projectId].steps.length === initialLength) {
    return res.status(404).json({ success: false, message: `Step ID '${stepId}' not found.` });
  }

  if (writeWorkflows(workflows)) {
    res.json({
      success: true,
      message: `Step '${stepId}' removed successfully.`,
      data: workflows[projectId],
    });
  } else {
    res.status(500).json({ success: false, message: "Failed to delete step." });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for single-page routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Suriya N Portfolio Server running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📡 Workflow API: http://localhost:${PORT}/api/projects`);
  console.log(`===================================================`);
});
