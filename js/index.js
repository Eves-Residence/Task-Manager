const scriptURL = "https://script.google.com/macros/s/AKfycbzgQJmOWTbUIVsTjKAZzrs0n439Bo_2PsPNrVQqIv-w-IMBRsQgAxV3wg8o7r0Sc7i6sA/exec";
const form = document.getElementById("todo-form");
const taskList = document.getElementById("taskList");
const responseMsg = document.getElementById("response");

// 🔹 Filter dropdown
const filterContainer = document.createElement("div");
filterContainer.innerHTML = `
  <label for="statusFilter"><b>Filter by Status:</b></label>
  <select id="statusFilter">
    <option value="All">All</option>
    <option value="Not Started">Not Started</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
  </select>
`;
filterContainer.style.marginBottom = "10px";
taskList.parentNode.insertBefore(filterContainer, taskList);

let allTasks = [];
let editIndex = null;

// 🔹 Modal HTML (Edit: Status + Add Remarks)
const modalHTML = `
  <div id="modalOverlay" style="
    display:none;
    position:fixed;
    top:0; left:0;
    width:100%; height:100%;
    background:rgba(0,0,0,0.5);
    justify-content:center;
    align-items:center;
    z-index:1000;">
    <div id="modalBox" style="
      background:#fff;
      padding:20px;
      border-radius:10px;
      box-shadow:0 0 20px rgba(0,0,0,0.3);
      width:100%;
      max-width:500px;
      box-sizing:border-box;">
      
      <div style="display:flex;flex-direction:column;gap:10px;">
        <h3>Edit Task</h3>

        <label for="editStatus">Status:</label>
        <select id="editStatus" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;">
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <label for="addRemarks">Add Remarks:</label>
        <textarea id="addRemarks" placeholder="Add new remark..." style="
          width:100%;
          padding:8px;
          border:1px solid #ccc;
          border-radius:5px;
          resize:none;
          overflow:hidden;
          min-height:100px;
          max-height:300px;
          font-family:inherit;
          font-size:14px;
          line-height:1.4;
          box-sizing:border-box;"></textarea>
      </div>

      <div style="margin-top:15px;display:flex;justify-content:flex-end;gap:10px;">
        <button id="saveEditBtn" style="padding:10px 16px;background:#4CAF50;color:#fff;border:none;border-radius:5px;">Save</button>
        <button id="cancelEditBtn" style="padding:10px 16px;background:#ccc;border:none;border-radius:5px;">Cancel</button>
      </div>
    </div>
  </div>`;
document.body.insertAdjacentHTML("beforeend", modalHTML);

const modalOverlay = document.getElementById("modalOverlay");
const editStatus = document.getElementById("editStatus");
const addRemarks = document.getElementById("addRemarks");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// 🔹 Auto-resize textarea
addRemarks.addEventListener("input", () => {
  addRemarks.style.height = "auto";
  const newHeight = Math.min(addRemarks.scrollHeight, 300);
  addRemarks.style.height = newHeight + "px";
  addRemarks.style.overflowY = addRemarks.scrollHeight > 300 ? "auto" : "hidden";
});

// 🔹 Add Task
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const task = {
    action: "add",
    taskName: document.getElementById("taskName").value.trim(),
    priority: document.getElementById("priority").value,
    assignedBy: document.getElementById("assignedBy").value.trim(),
    dueDate: document.getElementById("dueDate").value,
    notes: document.getElementById("notes").value.trim(),
  };

  if (!task.taskName) {
    responseMsg.textContent = "⚠️ Task name is required!";
    return;
  }

  responseMsg.textContent = "⏳ Saving task...";
  try {
    await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify(task),
    });
    responseMsg.textContent = "✅ Task saved successfully!";
    form.reset();
    setTimeout(fetchTasks, 800);
  } catch (err) {
    responseMsg.textContent = "❌ Error: " + err.message;
  }
});

// 🔹 Fetch Tasks
async function fetchTasks() {
  taskList.innerHTML = "<p>Loading tasks...</p>";
  try {
    const res = await fetch(scriptURL);
    const text = await res.text();
    const jsonMatch = text.match(/\{.*\}|\[.*\]/s);
    if (!jsonMatch) throw new Error("Invalid JSON format");

    const data = JSON.parse(jsonMatch[0]);
    allTasks = data;
    renderTasks();
  } catch (err) {
    taskList.innerHTML = `<p>⚠️ Error fetching tasks: ${err.message}</p>`;
  }
}

// 🔹 Render Tasks
function renderTasks() {
  const selectedStatus = document.getElementById("statusFilter").value;
  let tasksToShow = allTasks;
  if (selectedStatus !== "All") {
    tasksToShow = allTasks.filter((t) => (t["STATUS"] || "Not Started") === selectedStatus);
  }

  taskList.innerHTML = "";
  if (!tasksToShow || tasksToShow.length === 0) {
    taskList.innerHTML = "<p>No tasks found.</p>";
    return;
  }

  tasksToShow.forEach((t, index) => {
    const div = document.createElement("div");
    div.classList.add("task-item");

    const status = (t["STATUS"] || "Not Started").trim();
    let statusColor = "#999", bgColor = "#fff";
    if (status === "Completed") { statusColor = "#4CAF50"; bgColor = "#e8f5e9"; }
    else if (status === "In Progress") { statusColor = "#FFC107"; bgColor = "#fff9e6"; }
    else if (status === "Not Started") { statusColor = "#F44336"; bgColor = "#fdecea"; }

    div.style.borderLeft = `6px solid ${statusColor}`;
    div.style.backgroundColor = bgColor;

    const safe = (str) => !str ? "" : String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    div.innerHTML = `
      <div class="task-header">${safe(t["TASK NAME"])}</div>
      <div class="task-meta">
        <b>Priority:</b> ${safe(t["PRIORITY"])} |
        <b>Assigned By:</b> ${safe(t["ASSIGNED BY"]) || "-"} |
        <b>Due:</b> ${safe(t["DUE DATE"]) || "-"} |
        <b>Status:</b> <span style="color:${statusColor};font-weight:600;">${safe(status)}</span>
      </div>
      ${t["NOTES"] ? `<div class="task-notes"><b>Notes:</b> ${safe(t["NOTES"])}</div>` : ""}
      <div class="task-remarks-container">
        ${t["REMARKS"] ? `<div class="task-remarks"><b>Remarks:</b> ${safe(t["REMARKS"]).replace(/\n/g, "<br>")}</div>` : ""}
        ${t["FINISH DATE"] ? `<div class="task-finish"><b>Finish Date:</b> ${safe(formatDate(t["FINISH DATE"]))}</div>` : ""}
      </div>
      <div class="task-meta">${safe(formatDate(t["TIMESTAMP"])) || ""}</div>
      <div class="task-actions">
        ${status !== "Completed" ? `<button class="edit-btn" data-index="${index}">Edit</button>` : ""}
        <button class="delete-btn" data-index="${index}">🗑️ Delete</button>
      </div>
    `;

    if (status !== "Completed") {
      div.querySelector(".edit-btn").addEventListener("click", () => openEditModal(index));
    }
    div.querySelector(".delete-btn").addEventListener("click", () => deleteTask(index));

    taskList.appendChild(div);
  });
}

// 🔹 Format date helper (convert to MM/DD/YYYY HH:mm:ss)
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// 🔹 Open Edit Modal
function openEditModal(index) {
  editIndex = index;
  const t = allTasks[index];
  editStatus.value = t["STATUS"] || "Not Started";
  addRemarks.value = "";
  modalOverlay.style.display = "flex";
}

// 🔹 Close Modal
cancelEditBtn.addEventListener("click", () => (modalOverlay.style.display = "none"));

// 🔹 Save Edit (Add Remarks + Update Status)
saveEditBtn.addEventListener("click", async () => {
  if (editIndex === null) return;

  const remarkInput = addRemarks.value.trim();
  const selectedStatus = editStatus.value;
  const now = new Date();
  const currentDate = now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const updatedTask = {
    action: "update",
    rowIndex: editIndex,
    status: selectedStatus,
    remarks: remarkInput,
    finishDate: selectedStatus === "Completed" ? currentDate : (allTasks[editIndex]["FINISH DATE"] || ""),
  };

  try {
    await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify(updatedTask),
    });
    modalOverlay.style.display = "none";
    fetchTasks();
  } catch (err) {
    alert("❌ Error updating: " + err.message);
  }
});

// 🔹 Delete Task
async function deleteTask(index) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify({ action: "delete", rowIndex: index }),
    });
    fetchTasks();
  } catch (err) {
    alert("❌ Error deleting: " + err.message);
  }
}

// 🔹 Filter
document.getElementById("statusFilter").addEventListener("change", renderTasks);

// 🔹 Auto-load
window.addEventListener("load", fetchTasks);
  
