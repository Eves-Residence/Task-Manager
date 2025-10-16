const scriptURL = "https://script.google.com/macros/s/AKfycbwYerezYNrrXgKMdqZLI1owz_NBrtDBGkANX6HrQ1HsO5ngAQi7zARBM-0P-QJTeD2Vgg/exec";
const form = document.getElementById("todo-form");
const taskList = document.getElementById("taskList");
const responseMsg = document.getElementById("response");

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

// ✅ Modal HTML
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

        <label for="editNotes">Notes:</label>
        <textarea id="editNotes" style="
          width:100%;
          padding:8px;
          border:1px solid #ccc;
          border-radius:5px;
          resize:none;
          overflow:hidden;
          min-height:50px;
          max-height:500px;
          font-family:inherit;
          font-size:14px;
          line-height:1.4;
          box-sizing:border-box;"></textarea>
      </div>

      <div style="margin-top:15px;text-align:right;">
        <button id="saveEditBtn" style="padding:6px 12px;background:#4CAF50;color:#fff;border:none;border-radius:5px;">Save</button>
        <button id="cancelEditBtn" style="padding:6px 12px;background:#ccc;border:none;border-radius:5px;">Cancel</button>
      </div>
    </div>
  </div>`;
document.body.insertAdjacentHTML("beforeend", modalHTML);

const modalOverlay = document.getElementById("modalOverlay");
const editStatus = document.getElementById("editStatus");
const editNotes = document.getElementById("editNotes");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

editNotes.addEventListener("input", () => {
  editNotes.style.height = "auto";
  const newHeight = Math.min(editNotes.scrollHeight, 500);
  editNotes.style.height = newHeight + "px";
  editNotes.style.overflowY = editNotes.scrollHeight > 500 ? "auto" : "hidden";
});

// ✅ Add task
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

// ✅ Fetch tasks
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

// ✅ Render tasks
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
      ${t["NOTES"] ? `<div class="task-notes">🗒 ${safe(t["NOTES"])}</div>` : ""}
      <div class="task-meta">🕒 ${safe(t["TIMESTAMP"]) || ""}</div>
      <div class="task-actions">
        <button class="edit-btn" data-index="${index}">✏️ Edit</button>
        <button class="delete-btn" data-index="${index}">🗑️ Delete</button>
      </div>
    `;

    div.querySelector(".edit-btn").addEventListener("click", () => openEditModal(index));
    div.querySelector(".delete-btn").addEventListener("click", () => deleteTask(index));

    taskList.appendChild(div);
  });
}

// ✅ Open edit modal
function openEditModal(index) {
  editIndex = index;
  const t = allTasks[index];
  editStatus.value = t["STATUS"] || "Not Started";
  editNotes.value = t["NOTES"] || "";
  modalOverlay.style.display = "flex";
}

// ✅ Close modal
cancelEditBtn.addEventListener("click", () => (modalOverlay.style.display = "none"));

// ✅ Save edit
saveEditBtn.addEventListener("click", async () => {
  if (editIndex === null) return;
  const updatedTask = {
    action: "update",
    rowIndex: editIndex,
    status: editStatus.value,
    notes: editNotes.value.trim(),
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

// ✅ Delete task
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

// ✅ Filter
document.getElementById("statusFilter").addEventListener("change", renderTasks);

// ✅ Auto-load
window.addEventListener("load", fetchTasks);
