import { createContext, useContext, useState, ReactNode } from "react";
import { defaultTasks } from "../default-tasks";
import { Task, TaskStatus } from "../tasks.types";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";

let nextId = defaultTasks.length + 1;

type TasksContextType = {
  tasks: Task[];
  addTask: (title: string) => void;
  setTaskStatus: (id: number, status: TaskStatus) => void;
  deleteTask: (id: number) => void;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

  // make our copilot aware of this state by using the useCopilotReadable hook
  useCopilotReadable({
    description: "The state of the todo list",
    value: JSON.stringify(tasks)
  });

  useCopilotChatSuggestions(
    {
      instructions: "Suggest the most relevant next actions.",
    },
    [tasks],
  );

  // the function to addition of new tasks
  useCopilotAction({
    name: "addTask",
    description: "Add a new task to the todo list",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the task",
      },
    ],
    handler: async ({ title }) => {
      addTask(title);
      return `Task "${title}" added.`;
    },
  });

  // the function to update the tasks status
  useCopilotAction({
    name: "setTaskStatus",
    description: "Set the status of a task",
    parameters: [
      {
        name: "id",
        type: "number",
        description: "The ID of the task",
      },
      {
        name: "status",
        type: "string",
        description: "The new status of the task (todo, in-progress, done)",
      },
    ],
    handler: async ({ id, status }) => {
      setTaskStatus(id, status as TaskStatus);
      return `Task ${id} status updated to ${status}.`;
    }
  });

  // the function to delete a task
  useCopilotAction({
    name: "deleteTask",
    description: "Delete a task by its id",
    parameters: [
      {
        name: "id",
        type: "number",
        description: "The id of the task to delete",
      },
    ],
    handler: async ({ id }) => {
      deleteTask(id);
      return `Task with id ${id} deleted.`;
    },
  });

  const addTask = (title: string) => {
    setTasks([...tasks, { id: nextId++, title, status: TaskStatus.todo }]);
  };

  const setTaskStatus = (id: number, status: TaskStatus) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, setTaskStatus, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};
