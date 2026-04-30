const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

const router = express.Router();

const isProjectMember = (project, userId) => {
  const idStr = String(userId);
  return (
    String(project.createdBy) === idStr ||
    project.members.some((memberId) => String(memberId) === idStr)
  );
};

router.post(
  "/",
  auth,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").optional().isString(),
    body("project").notEmpty().withMessage("Project id is required"),
    body("assignedTo").notEmpty().withMessage("assignedTo user id is required"),
    body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, project, assignedTo, dueDate } = req.body;
      if (!mongoose.Types.ObjectId.isValid(project) || !mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: "Invalid project or assignedTo id" });
      }

      const targetProject = await Project.findById(project);
      if (!targetProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!isProjectMember(targetProject, req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!isProjectMember(targetProject, assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo user must be a project member" });
      }

      const task = await Task.create({
        title,
        description,
        project,
        assignedTo,
        dueDate,
      });

      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }],
    }).select("_id");

    const projectIds = projects.map((project) => project._id);
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate("assignedTo", "name email role")
      .populate("project", "title");

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("project", "title members createdBy");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!isProjectMember(task.project, req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/:id",
  auth,
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("description").optional().isString(),
    body("status")
      .optional()
      .isIn(["todo", "in-progress", "done"])
      .withMessage("Invalid status"),
    body("assignedTo").optional().notEmpty().withMessage("assignedTo cannot be empty"),
    body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid task id" });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!isProjectMember(project, req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { title, description, status, assignedTo, dueDate } = req.body;
      if (assignedTo && !isProjectMember(project, assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo user must be a project member" });
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (dueDate !== undefined) task.dueDate = dueDate;

      await task.save();
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["todo", "in-progress", "done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    task.status = status;
    await task.save();
    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/assign", auth, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "Valid assignedTo is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!isProjectMember(project, assignedTo)) {
      return res
        .status(400)
        .json({ message: "assignedTo user must be a project member" });
    }

    task.assignedTo = assignedTo;
    await task.save();
    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await task.deleteOne();
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
