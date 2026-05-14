import { useEffect, useState } from "react";

function Checklist() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("dashboard-checklist");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            text: "Agregá acá tus tareas pendientes",
            completed: false
          }
        ];
  });

  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "dashboard-checklist",
      JSON.stringify(tasks)
    );
  }, [tasks]);

  function addTask() {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask("");
  }

  function toggleTask(id) {
    setTasks(
      tasks.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id) {
    setTasks(tasks.filter(task => task.id !== id));
  }

  return (
    <div className="card checklistCard">

      <div className="checklistHeader">
        <h2>📝 Mis tareas pendientes</h2>
      </div>

      <div className="checklistInputRow">

        <input type="text" placeholder="Agregar nota o tarea..." value={newTask}
          onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
        />

        <button onClick={addTask}>
          Guardar
        </button>

      </div>

      <div className="checklistTasks">

        {tasks.map(task => (
          <div key={task.id} className={`checklistTask ${task.completed ? "completedTask" : ""}`}>
            <div className="checklistTaskLeft">
                <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)}/>
                <span> {task.text} </span>
            </div>
            <button className="deleteTaskBtn" onClick={() => deleteTask(task.id)}>
              🗑️
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Checklist;