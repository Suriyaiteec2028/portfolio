/* ==========================================================================
   Project Workflow Visualizer Engine & Modal Component
   ========================================================================== */

class WorkflowViewer {
  constructor() {
    this.modalOverlay = null;
    this.currentScale = 1;
    this.activeProjectId = null;
    this.activeWorkflowData = null;
    this.selectedStepId = null;

    this.initModalDOM();
  }

  // Inject Modal Structure into DOM
  initModalDOM() {
    if (document.getElementById("wfModalOverlay")) {
      this.modalOverlay = document.getElementById("wfModalOverlay");
      return;
    }

    const modalHTML = `
      <div id="wfModalOverlay" class="wf-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wfModalTitle">
        <div class="wf-modal" id="wfModal">
          <!-- Modal Header -->
          <div class="wf-header">
            <div class="wf-header-title">
              <div class="wf-header-icon"><i class="fas fa-diagram-project"></i></div>
              <div class="wf-header-text">
                <h3 id="wfModalTitle">Project Workflow</h3>
                <p id="wfModalSubtitle">End-to-End System Architecture & Execution Flow</p>
              </div>
            </div>

            <div class="wf-toolbar">
              <button class="wf-tool-btn" id="wfZoomIn" title="Zoom In"><i class="fas fa-search-plus"></i></button>
              <button class="wf-tool-btn" id="wfZoomOut" title="Zoom Out"><i class="fas fa-search-minus"></i></button>
              <button class="wf-tool-btn" id="wfReset" title="Reset View"><i class="fas fa-rotate-left"></i> Reset</button>
              <button class="wf-tool-btn" id="wfFullscreen" title="Toggle Fullscreen"><i class="fas fa-expand"></i></button>
              <button class="wf-close-btn" id="wfCloseBtn" title="Close Modal" aria-label="Close Modal"><i class="fas fa-times"></i></button>
            </div>
          </div>

          <!-- Modal Body & Content Split -->
          <div class="wf-body">
            <!-- Diagram Viewport -->
            <div class="wf-viewport" id="wfViewport">
              <div class="wf-canvas-container" id="wfCanvasContainer">
                <svg class="wf-svg-layer" id="wfSvgLayer"></svg>
                <div class="wf-sequence" id="wfSequenceContainer"></div>
              </div>
            </div>

            <!-- Detail Inspector Panel -->
            <div class="wf-inspector" id="wfInspector">
              <div class="wf-inspector-header">
                <h4 class="wf-inspector-title"><i class="fas fa-circle-info"></i> Step Inspection</h4>
              </div>
              <div id="wfInspectorContent">
                <p style="color: var(--wf-text-secondary); font-size: 0.9rem;">Click any workflow step in the diagram to inspect inputs, processing details, tech stack, and outputs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.modalOverlay = document.getElementById("wfModalOverlay");

    this.bindEvents();
  }

  // Event Listeners for Toolbar & Controls
  bindEvents() {
    // Close button
    document.getElementById("wfCloseBtn").addEventListener("click", () => this.close());

    // Backdrop click
    this.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    // ESC key close
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalOverlay.classList.contains("active")) {
        this.close();
      }
    });

    // Zoom Controls
    document.getElementById("wfZoomIn").addEventListener("click", () => this.zoom(0.15));
    document.getElementById("wfZoomOut").addEventListener("click", () => this.zoom(-0.15));
    document.getElementById("wfReset").addEventListener("click", () => this.resetZoom());

    // Fullscreen Toggle
    document.getElementById("wfFullscreen").addEventListener("click", () => {
      const modal = document.getElementById("wfModal");
      modal.classList.toggle("fullscreen");
    });
  }

  // Open Workflow Modal for given Project ID
  async open(projectId) {
    this.activeProjectId = projectId;
    this.resetZoom();
    this.modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";

    await this.fetchAndRenderWorkflow(projectId);
  }

  // Close Workflow Modal
  close() {
    this.modalOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
    const modal = document.getElementById("wfModal");
    modal.classList.remove("fullscreen");
  }

  // Zoom Handler
  zoom(delta) {
    this.currentScale = Math.min(Math.max(0.5, this.currentScale + delta), 2.0);
    const canvas = document.getElementById("wfCanvasContainer");
    if (canvas) {
      canvas.style.transform = `scale(${this.currentScale})`;
    }
  }

  // Reset Zoom
  resetZoom() {
    this.currentScale = 1;
    const canvas = document.getElementById("wfCanvasContainer");
    if (canvas) {
      canvas.style.transform = `scale(1)`;
    }
  }

  // Fetch Workflow Data from REST API
  async fetchAndRenderWorkflow(projectId) {
    const sequenceContainer = document.getElementById("wfSequenceContainer");
    const inspectorContent = document.getElementById("wfInspectorContent");
    const modalTitle = document.getElementById("wfModalTitle");
    const modalSubtitle = document.getElementById("wfModalSubtitle");

    // Loading State
    sequenceContainer.innerHTML = `
      <div style="text-align: center; color: var(--wf-text-secondary); padding: 3rem;">
        <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--wf-accent-blue); margin-bottom: 1rem;"></i>
        <p>Fetching project workflow architecture...</p>
      </div>
    `;

    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();

      if (!resData.success || !resData.data || !resData.data.steps || resData.data.steps.length === 0) {
        this.renderEmptyState(resData.data ? resData.data.projectName : projectId);
        return;
      }

      this.activeWorkflowData = resData.data;

      // Update Header
      modalTitle.textContent = resData.data.projectName || "Project Workflow";
      modalSubtitle.textContent = resData.data.tagline || "System Architecture & Execution Flow";

      // Render Sequence Diagram Nodes
      this.renderSequenceNodes(resData.data.steps);

      // Default select first step
      if (resData.data.steps.length > 0) {
        this.inspectStep(resData.data.steps[0].stepId);
      }
    } catch (err) {
      console.warn("API fetch error, using fallback state:", err);
      this.renderEmptyState(projectId);
    }
  }

  // Render Empty State Fallback
  renderEmptyState(projectName) {
    const sequenceContainer = document.getElementById("wfSequenceContainer");
    const inspectorContent = document.getElementById("wfInspectorContent");
    const modalTitle = document.getElementById("wfModalTitle");

    if (modalTitle) modalTitle.textContent = projectName || "Project Workflow";

    sequenceContainer.innerHTML = `
      <div class="wf-empty-state">
        <div class="wf-empty-icon"><i class="fas fa-compass-drafting"></i></div>
        <h4>Workflow Details Coming Soon</h4>
        <p>The interactive system architecture and step-by-step data execution flow for <strong>${projectName}</strong> is currently being documented.</p>
      </div>
    `;

    inspectorContent.innerHTML = `
      <div style="color: var(--wf-text-secondary); font-size: 0.88rem; text-align: center; padding: 2rem 0;">
        <i class="fas fa-clock fa-2x" style="margin-bottom: 0.8rem; color: var(--wf-accent-cyan);"></i>
        <p>Workflow configuration pending for this project.</p>
      </div>
    `;
  }

  // Render Connected Nodes in Sequence
  renderSequenceNodes(steps) {
    const sequenceContainer = document.getElementById("wfSequenceContainer");
    sequenceContainer.innerHTML = "";

    steps.forEach((step, index) => {
      // Determine badge type class
      const badgeClass = `wf-badge-${step.type || "processing"}`;
      const iconClass = step.icon ? `fas ${step.icon}` : "fas fa-gear";

      const nodeHTML = `
        <div class="wf-node" data-step-id="${step.stepId}" id="wf-node-${step.stepId}">
          <div class="wf-node-top">
            <span class="wf-node-step-number">Step 0${index + 1}</span>
            <div class="wf-node-icon"><i class="${iconClass}"></i></div>
          </div>
          
          <h4 class="wf-node-title">${step.title}</h4>
          
          <div class="wf-node-tech-preview">
            <span class="wf-node-badge ${badgeClass}">${step.type || "Step"}</span>
            <span><i class="fas fa-microchip"></i> ${step.technology.split(",")[0]}</span>
          </div>
        </div>
      `;

      sequenceContainer.insertAdjacentHTML("beforeend", nodeHTML);

      // Add connecting arrow if not last step
      if (index < steps.length - 1) {
        sequenceContainer.insertAdjacentHTML(
          "beforeend",
          `<div class="wf-connector"><i class="fas fa-arrow-right"></i></div>`
        );
      }
    });

    // Attach Click Handler to Node Elements
    steps.forEach((step) => {
      const nodeElem = document.getElementById(`wf-node-${step.stepId}`);
      if (nodeElem) {
        nodeElem.addEventListener("click", () => this.inspectStep(step.stepId));
      }
    });
  }

  // Display Step Info in Inspector Drawer
  inspectStep(stepId) {
    if (!this.activeWorkflowData || !this.activeWorkflowData.steps) return;

    this.selectedStepId = stepId;
    const step = this.activeWorkflowData.steps.find((s) => s.stepId === stepId);
    if (!step) return;

    // Highlight selected node
    document.querySelectorAll(".wf-node").forEach((node) => node.classList.remove("selected"));
    const activeNode = document.getElementById(`wf-node-${stepId}`);
    if (activeNode) activeNode.classList.add("selected");

    const inspectorContent = document.getElementById("wfInspectorContent");
    const badgeClass = `wf-badge-${step.type || "processing"}`;

    inspectorContent.innerHTML = `
      <div style="margin-bottom: 0.8rem;">
        <span class="wf-node-badge ${badgeClass}" style="font-size: 0.78rem;">${step.type || "Step"}</span>
        <h3 style="color: var(--wf-text-primary); font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0 0.2rem 0;">${step.title}</h3>
        <p style="color: var(--wf-text-secondary); font-size: 0.88rem; margin: 0; line-height: 1.4;">${step.description}</p>
      </div>

      <!-- Input Detail Card -->
      <div class="wf-detail-card">
        <div class="wf-detail-card-label"><i class="fas fa-right-to-bracket"></i> Input Payload</div>
        <div class="wf-detail-card-value">${step.input}</div>
      </div>

      <!-- Processing Detail Card -->
      <div class="wf-detail-card">
        <div class="wf-detail-card-label"><i class="fas fa-cogs"></i> Processing & Logic</div>
        <div class="wf-detail-card-value">${step.process}</div>
      </div>

      <!-- Technology Detail Card -->
      <div class="wf-detail-card">
        <div class="wf-detail-card-label"><i class="fas fa-layer-group"></i> Technologies Used</div>
        <div class="wf-detail-card-value" style="color: var(--wf-accent-cyan); font-weight: 600;">${step.technology}</div>
      </div>

      <!-- Output Detail Card -->
      <div class="wf-detail-card">
        <div class="wf-detail-card-label"><i class="fas fa-right-from-bracket"></i> Output Result</div>
        <div class="wf-code-box">${step.output}</div>
      </div>
    `;
  }
}

// Instantiate Global Workflow Controller
document.addEventListener("DOMContentLoaded", () => {
  const workflowEngine = new WorkflowViewer();

  // Attach listener to all "View Workflow" buttons
  document.querySelectorAll(".workflow-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const projectId = btn.getAttribute("data-project-id");
      if (projectId) {
        workflowEngine.open(projectId);
      }
    });
  });

  // Export globally
  window.workflowEngine = workflowEngine;
});
