import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Link from "@mui/material/Link";
import axios from "axios";
import { useUser } from "../UserContext";
import "./dashboard.css";

Modal.setAppElement("#root");

const Dashboard = () => {
  // const { userId } = useUser();
  const { userId, setUserId } = useUser();
  const [lists, setLists] = useState([]);
  // Added state for the task text and modal visibility
  const [taskText, setTaskText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalListId, setModalListId] = useState(null);
  const [checkboxStates, setCheckboxStates] = useState({});
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    // Retrieve userId from local storage on component mount
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    const fetchUserLists = async () => {
      try {
        // Fetch user lists
        const listsResponse = await axios.get(
          `http://localhost:5446/lists/${userId}`,
        );
        const userLists = listsResponse.data;

        // Fetch tasks for each list
        const fetchTasksPromises = userLists.map(async (list) => {
          const tasksResponse = await axios.get(
            `http://localhost:5446/tasks/${list.list_id}`,
          );
          const tasks = tasksResponse.data;
          return { ...list, tasks };
        });

        // Wait for all tasks to be fetched
        const listsWithTasks = await Promise.all(fetchTasksPromises);
        setLists(listsWithTasks);
      } catch (error) {
        console.error("Error fetching user lists and tasks:", error.message);
      }
    };

    fetchUserLists();
  }, [userId, setUserId]);

  // console.log(lists);

  const mockUser = { id: userId, username: "john_doe" };

  // console.log(userId);

  // Function to handle opening the "Create New List" modal
  const openNewListModal = () => {
    setIsNewListModalOpen(true);
  };

  // Function to handle closing the "Create New List" modal
  const closeNewListModal = () => {
    setIsNewListModalOpen(false);
    // Clear the new list name when the modal is closed
    setNewListName("");
  };

  const initializeCheckboxStates = (lists) => {
    const initialCheckboxStates = {};
    lists.forEach((list) => {
      list.tasks.forEach((task) => {
        initialCheckboxStates[task.task_id] = task.completed || false;
      });
    });
    setCheckboxStates(initialCheckboxStates);
  };

  useEffect(() => {
    initializeCheckboxStates(lists);
  }, []);

  const handleCheckboxChange = async (taskId, listId) => {

    setTimeout(async () => {
      try {
        // Make a DELETE request to delete the task
        await axios.delete(`http://localhost:5446/tasks/${taskId}`);
  
        // Update the state to remove the task
        setLists((prevLists) => {
          const updatedLists = prevLists
            .map((list) => {
              if (list.list_id == listId) {
                // Filter out the task to be removed
                list.tasks = list.tasks.filter((task) => task.task_id !== taskId);
  
                // Check if the list is empty after removal
                if (list.tasks.length == 0) {
                  // If the list is empty, make a DELETE request to delete the list
                  axios.delete(`http://localhost:5446/lists/${list.list_id}`);
                  return null; // Return null to indicate removing the list
                }
              }
              return list;
            })
            .filter(Boolean);
  
            
  
          return updatedLists;
        });
        
      } catch (error) {
        console.error("Error deleting task:", error.message);
      }
    }, 500);
    
  };

  // Function to handle creating a new list
  const handleCreateNewList = async () => {
    try {
      const isNameDuplicate = lists.some(
        (list) => list.list_name == newListName,
      );

      if (isNameDuplicate) {
        alert(
          "A list with the same name already exists. Please choose a different name.",
        );
        return;
      }

      // Make a POST request to create a new list
      const response = await axios.post("http://localhost:5446/lists", {
        list_name: newListName,
        user_id: userId,
      });

      // console.log("Response: ", response);

      // Get the newly created list from the server response
      const newList = { ...response.data, tasks: [] };

      // console.log("newList: ", newList);

      // Update the state to include the new list
      // console.log("Prev lists: ", lists);
      setLists((prevLists) => [...prevLists, newList]);
      // console.log("New lists: ", lists);

      // Close the "Create New List" modal
      closeNewListModal();
    } catch (error) {
      console.error("Error creating a new list:", error.message);
    }
  };

  const handleAddTask = async (taskText, listId) => {
    try {
      // Make a POST request to create a new task
      const response = await axios.post("http://localhost:5446/tasks", {
        task_description: taskText,
        list_id: listId,
        task_status: "pending", // You can set the initial status as needed
      });

      // Get the newly created task from the server response
      const newTask = response.data;

      // Update the state to include the new task in the appropriate list
      setLists((prevLists) => {
        return prevLists.map((list) => {
          if (list.list_id == listId) {
            return { ...list, tasks: [...list.tasks, newTask] };
          }
          return list;
        });
      });

      // Close the modal after adding the task
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating a new task:", error.message);
    }
  };

  // drag and drop
  const handleDragStart = (e, taskId, sourceList, taskDescription) => {
    // console.log("Task id: ", taskId);
    // console.log("source list: ", sourceList);
    // console.log("source list id: ", sourceList.list_id);
    // console.log("Length of task of source list: ", sourceList.tasks.length);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceList", sourceList);
    e.dataTransfer.setData("sourceListId", parseInt(sourceList.list_id, 10));
    e.dataTransfer.setData("sourceListLength", sourceList.tasks.length);
    e.dataTransfer.setData("taskDescription", taskDescription);
  };

  const handleDrop = async (e, listId) => {
    // console.log("list id: ", listId);
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceList = e.dataTransfer.getData("sourceList");
    const sourceListId = e.dataTransfer.getData("sourceListId");
    const sourceListLength = e.dataTransfer.getData("sourceListLength");
    const task_description = e.dataTransfer.getData("taskDescription");

    // console.log("task id: ", taskId);
    // console.log("source list: ", sourceList);
    // console.log("source list length: ", sourceListLength);
    // console.log("task_description: ", task_description);

    try {
      // console.log("Destination list id: ", listId);
      await axios.delete(`http://localhost:5446/tasks/${taskId}`);

      await axios.post("http://localhost:5446/tasks", {
        task_description: task_description, // Replace with your task description
        list_id: listId, // Replace with your target list ID
        task_status: "", // Replace with your task status
      });

      // Check if the list is empty after removal
      // if (sourceListLength <= 1) {
      //   // If the list is empty, make a DELETE request to delete the list
      //   axios.delete(`http://localhost:5446/lists/${sourceListId}`);
      //   return null; // Return null to indicate removing the list
      // }
      // Fetch user lists
      const listsResponse = await axios.get(
        `http://localhost:5446/lists/${userId}`,
      );
      const userLists = listsResponse.data;

      // Fetch tasks for each list
      const fetchTasksPromises = userLists.map(async (list) => {
        const tasksResponse = await axios.get(
          `http://localhost:5446/tasks/${list.list_id}`,
        );
        const tasks = tasksResponse.data;
        return { ...list, tasks };
      });

      // Wait for all tasks to be fetched
      const listsWithTasks = await Promise.all(fetchTasksPromises);
      setLists(listsWithTasks);
    } catch (error) {
      console.error("Error moving task:", error.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="Dashboard">
      <nav className="navbar">
        <span className="username">Welcome, {mockUser.username}!</span>
        <Link href="/" variant="body2">
          <button className="logout-btn">Logout</button>
        </Link>
      </nav>
      <div className="lists-container">
        {lists.map((list) =>
          // Conditional check for 'list' before rendering
          list ? (
            <div key={list.list_id} className="list">
              <h2>{list.list_name}</h2>
              <div
                className="tasks"
                onDrop={(e) => handleDrop(e, list.list_id)}
                onDragOver={handleDragOver}
              >
                {list.tasks.map((task) => (
                  <div
                    key={task.task_id}
                    className={`task ${
                      task.task_status == "completed" ? "completed" : ""
                    }`}
                    id={task.task_id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e,
                        task.task_id,
                        list,
                        task.task_description,
                      )
                    }
                  >
                    <span className="taskcheck">
                      <input
                        type="checkbox"
                        checked={task.task_status == "completed"}
                        onChange={() =>
                          handleCheckboxChange(task.task_id, list.list_id)
                        }
                      />
                    </span>
                    <span>{task.task_description}</span>
                  </div>
                ))}
                <div className="add-task">
                  <button
                    className="add-task-btn"
                    onClick={() => {
                      setModalListId(list.list_id);
                      setIsModalOpen(true);
                    }}
                  >
                    Create New Task
                  </button>
                </div>
              </div>
            </div>
          ) : null, // Return null if 'list' is undefined
        )}
        <div className="list create-list">
          <button className="create-list-btn" onClick={openNewListModal}>
            Create New List
          </button>
        </div>
      </div>

      {/* Modal for creating a new list */}
      <Modal
        isOpen={isNewListModalOpen}
        onRequestClose={closeNewListModal}
        contentLabel="Create New List Modal"
        className="ReactModal__Content"
      >
        <h2>Create a New List</h2>
        <input
          type="text"
          placeholder="Enter list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          style={{ fontSize: "16px" }}
        />
        <button onClick={handleCreateNewList}>Create List</button>
        <button onClick={closeNewListModal}>Cancel</button>
      </Modal>

      {/* Modal for adding a new task */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add Task Modal"
        className="ReactModal__Content"
      >
        <h2>Add a New Task</h2>
        <input
          type="text"
          placeholder="Enter task"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          style={{ fontSize: "16px" }}
        />
        <button onClick={() => handleAddTask(taskText, modalListId)}>
          Add Task
        </button>
      </Modal>
    </div>
  );
};

export default Dashboard;
