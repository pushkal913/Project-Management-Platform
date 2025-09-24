const express = require('express');
const Document = require('../models/Document');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all documents
router.get('/', authenticate, async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('createdBy', 'name');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create document
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, project, task, category, status } = req.body;

    // Basic validation
    if (!title || !project) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    // Check if project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check task if provided
    if (task) {
      const taskExists = await Task.findById(task);
      if (!taskExists) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    const document = new Document({
      title,
      content: content || '',
      project,
      task: task || null,
      category: category || 'other',
      status: status || 'draft',
      createdBy: req.user._id
    });

    await document.save();

    const populatedDocument = await Document.findById(document._id)
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('createdBy', 'name');

    res.status(201).json({ 
      message: 'Document created successfully', 
      document: populatedDocument 
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, category, status } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Update fields
    if (title) document.title = title;
    if (content !== undefined) document.content = content;
    if (category) document.category = category;
    if (status) document.status = status;

    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('createdBy', 'name');

    res.json({ 
      message: 'Document updated successfully', 
      document: updatedDocument 
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;