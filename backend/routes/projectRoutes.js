const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/role");

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
    body("members").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, members = [] } = req.body;
      const allMembers = [...new Set([String(req.user._id), ...members.map(String)])];

      const project = await Project.create({
        title,
        description,
        members: allMembers,
        createdBy: req.user._id,
      });

      return res.status(201).json(project);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }],
    })
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(project);
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
    body("members").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!isProjectMember(project, req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { title, description, members } = req.body;

      if (title !== undefined) project.title = title;
      if (description !== undefined) project.description = description;
      if (members !== undefined) {
        const uniqueMembers = [...new Set([String(project.createdBy), ...members.map(String)])];
        project.members = uniqueMembers;
      }

      await project.save();
      return res.status(200).json(project);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/:id", auth, roleCheck("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.deleteOne();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
