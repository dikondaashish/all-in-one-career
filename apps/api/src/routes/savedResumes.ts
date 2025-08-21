import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const saveResumeSchema = z.object({
  name: z.string().min(1).max(200),
  content: z.string().min(50),
  filename: z.string().optional()
});

const updateResumeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(50).optional()
});

export default function createSavedResumesRouter(prisma: PrismaClient): express.Router {
  
  // GET /api/saved-resumes - Get user's saved resumes
  router.get('/', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const savedResumes = await prisma.savedResume.findMany({
        where: { userId },
        orderBy: { lastUsed: 'desc' },
        select: {
          id: true,
          name: true,
          filename: true,
          createdAt: true,
          lastUsed: true,
          content: true // Include content for frontend use
        }
      });

      res.json({
        resumes: savedResumes,
        total: savedResumes.length
      });

    } catch (error: any) {
      console.error('Get saved resumes error:', error);
      res.status(500).json({ error: 'Failed to fetch saved resumes' });
    }
  });

  // POST /api/saved-resumes - Save a new resume
  router.post('/', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { name, content, filename } = saveResumeSchema.parse(req.body);

      // Check if user already has a resume with this name
      const existingResume = await prisma.savedResume.findFirst({
        where: { 
          userId,
          name 
        }
      });

      if (existingResume) {
        return res.status(400).json({ 
          error: 'A resume with this name already exists. Please choose a different name.' 
        });
      }

      // Create new saved resume
      const savedResume = await prisma.savedResume.create({
        data: {
          userId,
          name,
          content,
          filename: filename || `${name.toLowerCase().replace(/\s+/g, '-')}.txt`,
          lastUsed: new Date()
        }
      });

      console.log(`Created saved resume: ${savedResume.id} for user: ${userId}`);

      res.status(201).json({
        message: 'Resume saved successfully',
        resume: {
          id: savedResume.id,
          name: savedResume.name,
          filename: savedResume.filename,
          createdAt: savedResume.createdAt,
          lastUsed: savedResume.lastUsed
        }
      });

    } catch (error: any) {
      console.error('Save resume error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid resume data', 
          details: error.issues 
        });
      }
      
      res.status(500).json({ error: 'Failed to save resume' });
    }
  });

  // GET /api/saved-resumes/:id - Get specific saved resume
  router.get('/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const savedResume = await prisma.savedResume.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!savedResume) {
        return res.status(404).json({ error: 'Saved resume not found' });
      }

      // Update last used timestamp
      await prisma.savedResume.update({
        where: { id },
        data: { lastUsed: new Date() }
      });

      res.json(savedResume);

    } catch (error: any) {
      console.error('Get saved resume error:', error);
      res.status(500).json({ error: 'Failed to fetch saved resume' });
    }
  });

  // PUT /api/saved-resumes/:id - Update saved resume
  router.put('/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const updateData = updateResumeSchema.parse(req.body);

      // Check if resume exists and belongs to user
      const existingResume = await prisma.savedResume.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!existingResume) {
        return res.status(404).json({ error: 'Saved resume not found' });
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== existingResume.name) {
        const nameConflict = await prisma.savedResume.findFirst({
          where: { 
            userId,
            name: updateData.name,
            id: { not: id }
          }
        });

        if (nameConflict) {
          return res.status(400).json({ 
            error: 'A resume with this name already exists. Please choose a different name.' 
          });
        }
      }

      // Update resume
      const updatedResume = await prisma.savedResume.update({
        where: { id },
        data: {
          ...updateData,
          lastUsed: new Date()
        }
      });

      console.log(`Updated saved resume: ${updatedResume.id} for user: ${userId}`);

      res.json({
        message: 'Resume updated successfully',
        resume: updatedResume
      });

    } catch (error: any) {
      console.error('Update saved resume error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid update data', 
          details: error.issues 
        });
      }
      
      res.status(500).json({ error: 'Failed to update saved resume' });
    }
  });

  // DELETE /api/saved-resumes/:id - Delete saved resume
  router.delete('/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if resume exists and belongs to user
      const existingResume = await prisma.savedResume.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!existingResume) {
        return res.status(404).json({ error: 'Saved resume not found' });
      }

      // Delete resume
      await prisma.savedResume.delete({
        where: { id }
      });

      console.log(`Deleted saved resume: ${id} for user: ${userId}`);

      res.json({ message: 'Resume deleted successfully' });

    } catch (error: any) {
      console.error('Delete saved resume error:', error);
      res.status(500).json({ error: 'Failed to delete saved resume' });
    }
  });

  return router;
}
