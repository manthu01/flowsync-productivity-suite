import {
  FaTasks,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import { useEffect, useState } from "react";

import {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus
} from "../services/taskService";

const Dashboard = () => {

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

const [description, setDescription] = useState("");

const [priority, setPriority] = useState("Medium");
const [editingTaskId, setEditingTaskId] = useState(null);
const [searchTerm, setSearchTerm] = useState("");

const [statusFilter, setStatusFilter] = useState("All");

const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {

    fetchTasks();

  }, []);

  const fetchTasks = async () => {

    try {

      const data = await getTasks();

      setTasks(data);

    } catch (error) {

      console.log(error);

    }

  };

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;
  const filteredTasks = tasks.filter((task) => {

  const matchesSearch =
    task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All"
      ? true
      : task.status === statusFilter;

  const matchesPriority =
    priorityFilter === "All"
      ? true
      : task.priority === priorityFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPriority
  );

});
const handleCreateTask = async () => {

  try {

    const newTask = {
      title,
      description,
      status: "In Progress",
      priority,
      due_date: "2026-05-20",
      user_id: 1
    };

    if (editingTaskId) {

  await updateTaskStatus(
    editingTaskId,
    newTask
  );

} else {

  await createTask(newTask);

}

    fetchTasks();

    setTitle("");
    setDescription("");
    setPriority("Medium");

setEditingTaskId(null);

  } catch (error) {

    console.log(error);

  }

};

const handleDeleteTask = async (id) => {

  try {

    await deleteTask(id);

    fetchTasks();

  } catch (error) {

    console.log(error);

  }

};
const handleCompleteTask = async (task) => {

  try {

    const updatedTask = {
      title: task.title,
      description: task.description,
      status:
        task.status === "Completed"
          ? "In Progress"
          : "Completed",
      priority: task.priority,
      due_date: task.due_date
    };

    await updateTaskStatus(
      task.id,
      updatedTask
    );

    fetchTasks();

  } catch (error) {

    console.log(error);

  }

};
const handleEditTask = (task) => {

  setTitle(task.title);

  setDescription(task.description);

  setPriority(task.priority);

  setEditingTaskId(task.id);

};
  return (

<div className="min-h-screen text-white p-8 bg-[radial-gradient(circle_at_top,#0f172a,#020617_70%)] relative overflow-hidden">
<div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full"></div>

<div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <h1 className="text-4xl font-bold mb-10">
        FlowSync Dashboard
      </h1>
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl mb-10">

  <h2 className="text-2xl font-bold mb-6">
   {editingTaskId
  ? "Update Task"
  : "Create Task"}
  </h2>

  <div className="flex flex-col gap-4">

    <input
      type="text"
      placeholder="Task Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    />

    <textarea
      placeholder="Task Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    />

    <select
      value={priority}
      onChange={(e) => setPriority(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    >

      <option>Low</option>
      <option>Medium</option>
      <option>High</option>

    </select>

    <button
      onClick={handleCreateTask}
      className="bg-blue-500 hover:bg-blue-600 transition-all p-3 rounded-xl font-bold"
    >
      Create Task
    </button>

  </div>

</div>
<div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl mb-10">

  <h2 className="text-2xl font-bold mb-6">
    Search & Filters
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <input
      type="text"
      placeholder="Search tasks..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    />

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    >

      <option>All</option>
      <option>Completed</option>
      <option>In Progress</option>

    </select>

    <select
      value={priorityFilter}
      onChange={(e) => setPriorityFilter(e.target.value)}
      className="p-3 rounded-xl bg-[#0f172a] outline-none"
    >

      <option>All</option>
      <option>Low</option>
      <option>Medium</option>
      <option>High</option>

    </select>

  </div>

</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 p-6 rounded-3xl shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-2 transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400">
                Total Tasks
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {tasks.length}
              </h2>

            </div>

            <FaTasks size={40} />

          </div>

        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-2xl hover:scale-[1.02] transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400">
                Completed
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {completedTasks}
              </h2>

            </div>

            <FaCheckCircle size={40} />

          </div>

        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-2xl hover:scale-[1.02] transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400">
                Pending
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {pendingTasks}
              </h2>

            </div>

            <FaClock size={40} />

          </div>

        </div>

      </div>
<div className="mt-10">

  <h2 className="text-2xl font-bold mb-6">
    Tasks
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {filteredTasks.map((task) => (
<div
  key={task.id}
  className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-2xl border border-[#334155]"
>

  <div className="mb-5">

    <h3 className="text-2xl font-semibold">
      {task.title}
    </h3>

    <p className="text-gray-400 mt-2">
      {task.description}
    </p>

  </div>

  <div className="flex gap-3 mb-5">

    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        task.status === "Completed"
          ? "bg-green-500/20 text-green-400"
          : "bg-blue-500/20 text-blue-400"
      }`}
    >
      {task.status}
    </span>

    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        task.priority === "High"
          ? "bg-red-500/20 text-red-400"
          : task.priority === "Medium"
          ? "bg-yellow-500/20 text-yellow-400"
          : "bg-green-500/20 text-green-400"
      }`}
    >
      {task.priority}
    </span>

  </div>

  <div className="flex gap-3">

    <button
      onClick={() => handleCompleteTask(task)}
      className="flex-1 bg-green-500 hover:bg-green-600 transition-all py-2 rounded-xl font-medium"
    >
      {task.status === "Completed"
        ? "Mark In Progress"
        : "Mark Completed"}
    </button>
<button
  onClick={() => handleEditTask(task)}
  className="bg-yellow-500 hover:bg-yellow-600 transition-all px-4 py-2 rounded-xl font-medium"
>
  Edit
</button>
    <button
      onClick={() => handleDeleteTask(task.id)}
      className="bg-red-500 hover:bg-red-600 transition-all px-4 py-2 rounded-xl font-medium"
    >
      Delete
    </button>

  </div>

</div>
    ))}

  </div>

</div>
    </div>
  );
};

export default Dashboard;