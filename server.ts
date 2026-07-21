/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';

dotenv.config();

const filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : __filename;
const dirname = typeof import.meta !== 'undefined' && import.meta.url
  ? path.dirname(filename)
  : __dirname;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini API client setup
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // AI Assistant endpoint
  app.post('/api/ai', async (req, res) => {
    try {
      const { message, history, workspaceContext } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!ai) {
        return res.status(500).json({
          error: 'Gemini API is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      // Format workspace context for Gemini to establish absolute workspace awareness
      let contextPrompt = '';
      if (workspaceContext) {
        contextPrompt = `
CURRENT WORKSPACE STATE & CONTEXT:
- Active Tab/Page: "${workspaceContext.activeTab || 'dashboard'}"
- Active Document/File ID: "${workspaceContext.activeFileId || 'none'}"
- Active Document/File Name: "${workspaceContext.activeFileName || 'none'}"
- Active Document/File Type: "${workspaceContext.activeFileType || 'none'}"
- Active Document/File Content preview: "${workspaceContext.activeFileContent || 'none'}"
- Selected Project/Subject: "${workspaceContext.activeProject || 'none'}"
- Current System Local Time: "${workspaceContext.currentTime || new Date().toISOString()}"
- Preferences / Memory: ${JSON.stringify(workspaceContext.memory || {})}
`;
      }

      const systemInstruction = `
You are the central "Intelligent Core Brain" and personal executive operating system of "LifeOS", a premium personal workspace.
Your job is to support the user in natural language, perform multi-step actions, automate workflows, and maintain deep contextual awareness.

In addition to answering the user with warmth, elegance, and extreme competence, you must automatically execute relevant actions across the LifeOS system by appending a JSON structure at the end of your response, wrapped inside a <COMMAND_BLOCK>...</COMMAND_BLOCK> tag.

You support executing single actions or multiple sequential actions.
Always structure the JSON as an object with an "actions" array:
{
  "actions": [
    { "action": "action_name", "payload": { ... } }
  ]
}

Available actions & payloads:
1. "create_task": { "title": string, "description"?: string, "priority"?: "low"|"medium"|"high"|"urgent", "category"?: string, "deadline"?: "YYYY-MM-DD" }
2. "update_task": { "id": string, "title"?: string, "priority"?: "low"|"medium"|"high"|"urgent", "isCompleted"?: boolean, "progress"?: number, "deadline"?: string, "category"?: string }
3. "delete_task": { "id": string }
4. "create_event": { "title": string, "description"?: string, "start": "YYYY-MM-DDTHH:MM:SS", "end": "YYYY-MM-DDTHH:MM:SS", "category"?: string }
5. "update_event": { "id": string, "title"?: string, "start"?: string, "end"?: string }
6. "cancel_event": { "id": string }
7. "create_note": { "title": string, "content": string, "folder"?: string, "tags"?: string[] }
8. "update_note": { "id": string, "title"?: string, "content"?: string, "folder"?: string }
9. "delete_note": { "id": string }  (Destructive - triggers confirmation dialog)
10. "create_study_exam": { "subjectName": string, "examTitle": string, "date": "YYYY-MM-DD" }
11. "create_study_session": { "subjectName": string, "durationMs": number, "notes": string }
12. "add_finance": { "type": "income"|"expense", "amount": number, "category": string, "notes": string }
13. "delete_finance": { "id": string }  (Destructive - triggers confirmation dialog)
14. "create_habit": { "name": string, "frequency"?: "daily"|"weekly"|"monthly" }
15. "log_habit": { "id": string, "date"?: string }
16. "delete_habit": { "id": string }  (Destructive - triggers confirmation dialog)
17. "create_goal": { "title": string, "description": string, "type": "long-term"|"short-term", "deadline": "YYYY-MM-DD", "milestones"?: string[] }
18. "open_file": { "id": string }  (Changes workspace view to open a specific file in Universal DocSpace)
19. "rename_file": { "id": string, "newName": string }
20. "move_file": { "id": string, "newFolder": string }
21. "delete_file": { "id": string }  (Destructive - triggers confirmation dialog)
22. "create_folder": { "folderName": string }
23. "change_tab": { "tabName": string }  (Values: "dashboard"|"tasks"|"calendar"|"notes"|"study"|"habits"|"goals"|"finance"|"bookmarks"|"files"|"google-workspace"|"analytics"|"settings")
24. "create_automation": { "trigger": string, "actionText": string }  (Saves a rule inside the automation engine)
25. "update_memory": { "key": string, "value": string, "label": string }  (Learns a key-value user preference)
26. "clear_workspace": {}  (Destructive - triggers confirmation dialog)
27. "sign_out": {}  (Destructive - triggers confirmation dialog)

Rules:
- Be highly responsive to workspace context! If the user says "summarize this", "rename this", "move this", check the active file from the workspace state and target it.
- Multi-Step Intelligence: If the user says "I have an exam next Monday", break it into multiple actions!
  e.g., [
    { "action": "create_study_exam", "payload": { "subjectName": "General", "examTitle": "Exam Preparation", "date": "2026-07-27" } },
    { "action": "create_task", "payload": { "title": "Revise study materials for Exam", "priority": "high", "deadline": "2026-07-26" } },
    { "action": "create_event", "payload": { "title": "Exam Study block", "start": "2026-07-26T14:00:00", "end": "2026-07-26T16:00:00" } }
  ]
- Remember User Preferences (Memory Bank): If the user tells you about their life, preferences, limits, wake-up times, timezone, save it using "update_memory"!
- Ensure that your conversational text is warm, clear, professional, concise, and highly supportive, explaining what you are doing (e.g. "I'm scheduling that block, setting a high-priority task, and adding the exam to your study deck.").
- Put the <COMMAND_BLOCK> tag at the absolute end.

${contextPrompt}
Current baseline date: Monday, July 20, 2026. Use this date as reference for relative dates!
`;

      const contents = history ? [...history, { role: 'user', parts: [{ text: message }] }] : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      const responseText = response.text || "I'm sorry, I couldn't process that.";
      return res.json({ text: responseText });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return res.status(500).json({ error: error.message || 'Error processing AI request' });
    }
  });

  // --- COLLABORATION HUB BACKEND CORE ---
  const DATA_FILE = path.join(dirname, 'collaboration_data.json');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsDir));

  function loadCollabData() {
    let data: any = null;
    let needsMigration = false;

    if (fs.existsSync(DATA_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (!data || !data.users || !data.users.some((u: any) => u.id === 'user_showaib')) {
          needsMigration = true;
        } else {
          // Verify that essential fields like username are present
          data.users.forEach((u: any) => {
            if (!u.username || !u.email || !u.friends || !u.friendRequests) {
              needsMigration = true;
            }
          });
        }
      } catch (e) {
        console.error('Error reading collaboration data:', e);
        needsMigration = true;
      }
    } else {
      needsMigration = true;
    }

    if (!needsMigration && data) {
      return data;
    }

    const defaultData = {
      users: [
        {
          id: 'user_me',
          name: 'You (LifeOS Operator)',
          username: '@operator',
          email: 'operator@gmail.com',
          university: 'AIUB',
          department: 'Computer Science',
          semester: 'Semester 4',
          bio: 'LifeOS Operator. Interested in responsive design, fullstack systems, and elegant student tools.',
          availability: 'online',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          friends: ['user_alex', 'user_sophia'],
          friendRequests: []
        },
        {
          id: 'user_alex',
          name: 'Alex Mercer',
          username: '@alex',
          email: 'alex@gmail.com',
          university: 'AIUB',
          department: 'Software Engineering',
          semester: 'Semester 5',
          bio: 'Database Architecture & Python developer. Let\'s build stable systems.',
          availability: 'online',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          friends: ['user_me', 'user_sophia'],
          friendRequests: []
        },
        {
          id: 'user_sophia',
          name: 'Sophia Patel',
          username: '@sophia',
          email: 'sophia@gmail.com',
          university: 'AIUB',
          department: 'Computer Science',
          semester: 'Semester 4',
          bio: 'Android & Algorithms enthusiast. Passionate about competitive programming.',
          availability: 'busy',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          friends: ['user_me', 'user_alex'],
          friendRequests: []
        },
        {
          id: 'user_evelyn',
          name: 'Dr. Evelyn Carter',
          username: '@evelyn',
          email: 'evelyn@gmail.com',
          university: 'AIUB',
          department: 'Computer Science',
          semester: 'Faculty / Professor',
          bio: 'Academic Advisor and AI Ethics researcher. Feel free to connect for research guidance.',
          availability: 'online',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          friends: [],
          friendRequests: []
        },
        {
          id: 'user_showaib',
          name: 'Showaib Mahmud',
          username: '@showaib',
          email: 'showaib@gmail.com',
          university: 'AIUB',
          department: 'Computer Science',
          semester: 'Semester 6',
          bio: 'AI researcher and Software Engineering student. Passionate about natural language models.',
          availability: 'offline',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          friends: [],
          friendRequests: []
        }
      ],
      studyGroups: [], // Kept for schema compatibility, though MVP removes groups from main tabs
      directMessages: [
        {
          id: 'dm_1',
          senderId: 'user_alex',
          receiverId: 'user_me',
          text: 'Hey! Did you find the study resources for the computer science midterms? Or do you need the syllabus?',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          readBy: ['user_alex', 'user_me']
        },
        {
          id: 'dm_2',
          senderId: 'user_me',
          receiverId: 'user_alex',
          text: 'Yeah, I have them! Let me share the midterm syllabus document with you right here.',
          timestamp: new Date(Date.now() - 3600000 + 300000).toISOString(),
          readBy: ['user_alex', 'user_me']
        },
        {
          id: 'dm_3',
          senderId: 'user_me',
          receiverId: 'user_alex',
          text: 'Here is the midterm syllabus document. Let me know if you want to review Chapter 3 tonight.',
          timestamp: new Date(Date.now() - 3600000 + 360000).toISOString(),
          fileUrl: '/uploads/dummy_syllabus.pdf',
          fileName: 'CSE_Midterm_Syllabus.pdf',
          fileType: 'pdf',
          readBy: ['user_alex', 'user_me']
        }
      ],
      notifications: [
        {
          id: 'not_1',
          message: 'Welcome to LifeOS Connect! Search for your classmates to start chatting.',
          timestamp: new Date().toISOString(),
          read: false,
          senderId: 'user_alex'
        }
      ]
    };

    // Ensure dummy file exists
    const dummyFile = path.join(uploadsDir, 'dummy_syllabus.pdf');
    if (!fs.existsSync(dummyFile)) {
      try {
        fs.writeFileSync(dummyFile, 'LifeOS Connect - CSE Semester 4 Core Syllabus content.');
      } catch (err) {
        console.error('Failed to write dummy syllabus PDF:', err);
      }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  function saveCollabData(data: any) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error saving collaboration data:', err);
    }
  }

  // Active WS connections tracking
  interface ActiveConnection {
    ws: WebSocket;
    userId: string;
    roomId?: string; // group_id or partner_id
  }
  let activeConnections: ActiveConnection[] = [];

  function broadcastToRoom(senderId: string, roomId: string | undefined, type: string, payload: any) {
    if (!roomId) return;
    activeConnections.forEach((conn) => {
      if (conn.roomId === roomId && conn.userId !== senderId) {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ type, payload }));
        }
      }
    });
  }

  function broadcastUserStatus(userId: string, status: string) {
    activeConnections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify({
          type: 'status_change',
          payload: { userId, status }
        }));
      }
    });
  }

  // --- REST ENDPOINTS ---

  // Get full collaboration schema
  // Get full collaboration schema with optional user identification
  app.get('/api/collaboration/data', (req, res) => {
    const { email, name } = req.query;
    const data = loadCollabData();
    
    if (email) {
      const emailStr = String(email).toLowerCase();
      // Try to find user by email
      let matchedUser = data.users.find((u: any) => u.email.toLowerCase() === emailStr);
      if (!matchedUser) {
        // If not found, let's adapt user_me (the default template operator)
        const userMe = data.users.find((u: any) => u.id === 'user_me');
        if (userMe) {
          userMe.email = emailStr;
          userMe.name = name ? String(name) : 'You';
          userMe.username = '@' + emailStr.split('@')[0];
          saveCollabData(data);
          matchedUser = userMe;
        } else {
          // Fallback if user_me was somehow deleted
          const newUser = {
            id: `user_${Date.now()}`,
            name: name ? String(name) : 'You',
            username: '@' + emailStr.split('@')[0],
            email: emailStr,
            university: 'AIUB',
            department: 'Computer Science',
            semester: 'Semester 4',
            bio: 'LifeOS Operator. Interested in responsive design, fullstack systems, and elegant student tools.',
            availability: 'online',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            friends: ['user_alex', 'user_sophia'],
            friendRequests: []
          };
          data.users.push(newUser);
          saveCollabData(data);
          matchedUser = newUser;
        }
      } else {
        // If user exists, update their name if passed and it changed
        if (name && matchedUser.name !== name && matchedUser.id === 'user_me') {
          matchedUser.name = String(name);
          saveCollabData(data);
        }
      }
      return res.json({ data, activeUserId: matchedUser.id });
    }
    
    res.json({ data, activeUserId: 'user_me' });
  });

  // Upload shared file
  app.post('/api/collaboration/upload', (req, res) => {
    const { fileName, fileType, base64Data } = req.body;
    if (!fileName || !base64Data) {
      return res.status(400).json({ error: 'FileName and base64Data are required' });
    }
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(filePath, buffer);
      
      const fileUrl = `/uploads/${uniqueName}`;
      res.json({
        fileUrl,
        fileName,
        fileType,
        size: `${(buffer.length / 1024).toFixed(1)} KB`
      });
    } catch (err: any) {
      console.error('File write error:', err);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Post / send a new message
  app.post('/api/collaboration/messages', (req, res) => {
    const { senderId, groupId, receiverId, text, replyToId, fileUrl, fileName, fileType, fileSize } = req.body;
    if (!senderId || !text) {
      return res.status(400).json({ error: 'SenderId and text are required' });
    }

    const data = loadCollabData();
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      replyToId,
      fileUrl,
      fileName,
      fileType,
      fileSize: fileSize || (fileUrl ? '2.4 MB' : undefined),
      readBy: [senderId]
    };

    if (groupId) {
      const group = data.studyGroups.find((g: any) => g.id === groupId);
      if (group) {
        group.messages.push(newMsg);
        // Also trigger automatic AI triggers if chat starts with /ai or @AI
        saveCollabData(data);
        broadcastToRoom(senderId, groupId, 'new_message', { groupId, message: newMsg });
        return res.json(newMsg);
      }
    } else if (receiverId) {
      data.directMessages.push({ ...newMsg, receiverId });
      saveCollabData(data);
      // Room ID for DMs can be defined as alphabetical combination of ids
      const roomKey = [senderId, receiverId].sort().join('_');
      broadcastToRoom(senderId, roomKey, 'new_message', { roomKey, message: newMsg });
      return res.json(newMsg);
    }

    res.status(400).json({ error: 'Invalid message target' });
  });

  // Edit message
  app.post('/api/collaboration/messages/edit', (req, res) => {
    const { messageId, text, groupId } = req.body;
    const data = loadCollabData();

    if (groupId) {
      const group = data.studyGroups.find((g: any) => g.id === groupId);
      if (group) {
        const msg = group.messages.find((m: any) => m.id === messageId);
        if (msg) {
          msg.text = text;
          msg.edited = true;
          saveCollabData(data);
          broadcastToRoom('system', groupId, 'message_edited', { groupId, messageId, text });
          return res.json({ success: true, message: msg });
        }
      }
    } else {
      const msg = data.directMessages.find((m: any) => m.id === messageId);
      if (msg) {
        msg.text = text;
        msg.edited = true;
        saveCollabData(data);
        const roomKey = [msg.senderId, msg.receiverId].sort().join('_');
        broadcastToRoom('system', roomKey, 'message_edited', { roomKey, messageId, text });
        return res.json({ success: true, message: msg });
      }
    }
    res.status(404).json({ error: 'Message not found' });
  });

  // Delete message
  app.post('/api/collaboration/messages/delete', (req, res) => {
    const { messageId, groupId } = req.body;
    const data = loadCollabData();

    if (groupId) {
      const group = data.studyGroups.find((g: any) => g.id === groupId);
      if (group) {
        group.messages = group.messages.filter((m: any) => m.id !== messageId);
        saveCollabData(data);
        broadcastToRoom('system', groupId, 'message_deleted', { groupId, messageId });
        return res.json({ success: true });
      }
    } else {
      const msgIndex = data.directMessages.findIndex((m: any) => m.id === messageId);
      if (msgIndex !== -1) {
        const msg = data.directMessages[msgIndex];
        const roomKey = [msg.senderId, msg.receiverId].sort().join('_');
        data.directMessages.splice(msgIndex, 1);
        saveCollabData(data);
        broadcastToRoom('system', roomKey, 'message_deleted', { roomKey, messageId });
        return res.json({ success: true });
      }
    }
    res.status(404).json({ error: 'Message not found' });
  });

  // Pin message
  app.post('/api/collaboration/messages/pin', (req, res) => {
    const { messageId, pinned, groupId } = req.body;
    const data = loadCollabData();

    if (groupId) {
      const group = data.studyGroups.find((g: any) => g.id === groupId);
      if (group) {
        const msg = group.messages.find((m: any) => m.id === messageId);
        if (msg) {
          msg.pinned = pinned;
          saveCollabData(data);
          broadcastToRoom('system', groupId, 'message_pinned', { groupId, messageId, pinned });
          return res.json({ success: true, message: msg });
        }
      }
    } else {
      const msg = data.directMessages.find((m: any) => m.id === messageId);
      if (msg) {
        msg.pinned = pinned;
        saveCollabData(data);
        const roomKey = [msg.senderId, msg.receiverId].sort().join('_');
        broadcastToRoom('system', roomKey, 'message_pinned', { roomKey, messageId, pinned });
        return res.json({ success: true, message: msg });
      }
    }
    res.status(404).json({ error: 'Message not found' });
  });

  // Read message receipts
  app.post('/api/collaboration/messages/read', (req, res) => {
    const { userId, groupId, partnerId } = req.body;
    const data = loadCollabData();
    let modified = false;

    if (groupId) {
      const group = data.studyGroups.find((g: any) => g.id === groupId);
      if (group) {
        group.messages.forEach((m: any) => {
          if (!m.readBy.includes(userId)) {
            m.readBy.push(userId);
            modified = true;
          }
        });
      }
    } else if (partnerId) {
      data.directMessages.forEach((m: any) => {
        if (((m.senderId === partnerId && m.receiverId === userId) || (m.senderId === userId && m.receiverId === partnerId)) && !m.readBy.includes(userId)) {
          m.readBy.push(userId);
          modified = true;
        }
      });
    }

    if (modified) {
      saveCollabData(data);
      const roomKey = groupId || [userId, partnerId].sort().join('_');
      broadcastToRoom(userId, roomKey, 'messages_read', { userId, groupId, partnerId });
    }
    res.json({ success: true });
  });

  // Create study group
  app.post('/api/collaboration/groups', (req, res) => {
    const { name, description, ownerId, members } = req.body;
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'GroupName and ownerId are required' });
    }

    const data = loadCollabData();
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      description: description || '',
      members: [
        { userId: ownerId, role: 'owner' },
        ...(members || []).map((m: any) => ({ userId: m.userId, role: m.role || 'member' }))
      ],
      messages: [],
      announcements: [],
      tasks: [],
      calendar: [],
      notes: [],
      resourceLibrary: []
    };

    data.studyGroups.push(newGroup);
    saveCollabData(data);

    // Notify other active WS clients
    activeConnections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify({ type: 'group_created', payload: newGroup }));
      }
    });

    res.json(newGroup);
  });

  // Group Announcement
  app.post('/api/collaboration/announcements', (req, res) => {
    const { groupId, title, content, authorId } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const newAnn = {
      id: `ann_${Date.now()}`,
      title,
      content,
      authorId,
      timestamp: new Date().toISOString(),
      reactions: [],
      comments: []
    };

    group.announcements.unshift(newAnn); // newer announcement first
    saveCollabData(data);
    broadcastToRoom(authorId, groupId, 'announcement_created', { groupId, announcement: newAnn });
    res.json(newAnn);
  });

  // Announcement reaction
  app.post('/api/collaboration/announcements/react', (req, res) => {
    const { groupId, announcementId, emoji, userId } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const ann = group.announcements.find((a: any) => a.id === announcementId);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });

    let reaction = ann.reactions.find((r: any) => r.emoji === emoji);
    if (reaction) {
      if (reaction.users.includes(userId)) {
        // remove reaction
        reaction.users = reaction.users.filter((id: string) => id !== userId);
        reaction.count--;
        if (reaction.count <= 0) {
          ann.reactions = ann.reactions.filter((r: any) => r.emoji !== emoji);
        }
      } else {
        // add user to reaction
        reaction.users.push(userId);
        reaction.count++;
      }
    } else {
      ann.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    saveCollabData(data);
    broadcastToRoom('system', groupId, 'announcements_updated', { groupId, announcements: group.announcements });
    res.json(ann);
  });

  // Announcement comment
  app.post('/api/collaboration/announcements/comment', (req, res) => {
    const { groupId, announcementId, authorId, text } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const ann = group.announcements.find((a: any) => a.id === announcementId);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });

    const newComment = {
      id: `com_${Date.now()}`,
      authorId,
      text,
      timestamp: new Date().toISOString()
    };

    ann.comments.push(newComment);
    saveCollabData(data);
    broadcastToRoom('system', groupId, 'announcements_updated', { groupId, announcements: group.announcements });
    res.json(ann);
  });

  // Group Tasks
  app.post('/api/collaboration/tasks', (req, res) => {
    const { groupId, action, task } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (action === 'create') {
      const newTask = {
        id: `task_${Date.now()}`,
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        deadline: task.deadline || '',
        status: 'todo',
        assignedTo: task.assignedTo || []
      };
      group.tasks.push(newTask);
      saveCollabData(data);
      broadcastToRoom('system', groupId, 'tasks_updated', { groupId, tasks: group.tasks });
      return res.json(newTask);
    } else if (action === 'update') {
      const existing = group.tasks.find((t: any) => t.id === task.id);
      if (existing) {
        Object.assign(existing, task);
        saveCollabData(data);
        broadcastToRoom('system', groupId, 'tasks_updated', { groupId, tasks: group.tasks });
        return res.json(existing);
      }
    } else if (action === 'delete') {
      group.tasks = group.tasks.filter((t: any) => t.id !== task.id);
      saveCollabData(data);
      broadcastToRoom('system', groupId, 'tasks_updated', { groupId, tasks: group.tasks });
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid task action' });
  });

  // Group Calendar
  app.post('/api/collaboration/calendar', (req, res) => {
    const { groupId, action, event } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (action === 'create') {
      const newEv = {
        id: `cal_${Date.now()}`,
        title: event.title,
        description: event.description || '',
        start: event.start,
        end: event.end,
        category: event.category || 'study'
      };
      group.calendar.push(newEv);
      saveCollabData(data);
      broadcastToRoom('system', groupId, 'calendar_updated', { groupId, calendar: group.calendar });
      return res.json(newEv);
    } else if (action === 'update') {
      const existing = group.calendar.find((e: any) => e.id === event.id);
      if (existing) {
        Object.assign(existing, event);
        saveCollabData(data);
        broadcastToRoom('system', groupId, 'calendar_updated', { groupId, calendar: group.calendar });
        return res.json(existing);
      }
    } else if (action === 'delete') {
      group.calendar = group.calendar.filter((e: any) => e.id !== event.id);
      saveCollabData(data);
      broadcastToRoom('system', groupId, 'calendar_updated', { groupId, calendar: group.calendar });
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid calendar action' });
  });

  // Collaborative Notes
  app.post('/api/collaboration/notes', (req, res) => {
    const { groupId, action, note } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (action === 'create') {
      const newNote = {
        id: `note_${Date.now()}`,
        title: note.title || 'Untitled Collaborative Note',
        content: note.content || '',
        lastEditedBy: note.lastEditedBy,
        lastEditedAt: new Date().toISOString(),
        versionHistory: [],
        comments: []
      };
      group.notes.push(newNote);
      saveCollabData(data);
      broadcastToRoom(note.lastEditedBy, groupId, 'notes_updated', { groupId, notes: group.notes });
      return res.json(newNote);
    } else if (action === 'update') {
      const existing = group.notes.find((n: any) => n.id === note.id);
      if (existing) {
        // Save to version history before overwriting
        if (existing.content !== note.content) {
          existing.versionHistory.unshift({
            id: `v_${Date.now()}`,
            content: existing.content,
            editedBy: existing.lastEditedBy,
            timestamp: existing.lastEditedAt
          });
          // cap history size
          if (existing.versionHistory.length > 15) {
            existing.versionHistory.pop();
          }
        }
        
        existing.content = note.content;
        existing.title = note.title || existing.title;
        existing.lastEditedBy = note.lastEditedBy;
        existing.lastEditedAt = new Date().toISOString();
        
        saveCollabData(data);
        broadcastToRoom(note.lastEditedBy, groupId, 'note_content_changed', { groupId, noteId: note.id, noteContent: note.content, lastEditedBy: note.lastEditedBy, lastEditedAt: existing.lastEditedAt });
        return res.json(existing);
      }
    } else if (action === 'comment') {
      const existing = group.notes.find((n: any) => n.id === note.id);
      if (existing) {
        const comment = {
          id: `nc_${Date.now()}`,
          authorId: note.comment.authorId,
          text: note.comment.text,
          timestamp: new Date().toISOString()
        };
        existing.comments.push(comment);
        saveCollabData(data);
        broadcastToRoom(note.comment.authorId, groupId, 'notes_updated', { groupId, notes: group.notes });
        return res.json(existing);
      }
    } else if (action === 'delete') {
      group.notes = group.notes.filter((n: any) => n.id !== note.id);
      saveCollabData(data);
      broadcastToRoom('system', groupId, 'notes_updated', { groupId, notes: group.notes });
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid notes action' });
  });

  // Resource Library upload / reference
  app.post('/api/collaboration/resources', (req, res) => {
    const { groupId, resource } = req.body;
    const data = loadCollabData();
    const group = data.studyGroups.find((g: any) => g.id === groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const newRes = {
      id: `res_${Date.now()}`,
      name: resource.name,
      url: resource.url,
      type: resource.type || 'file',
      size: resource.size || 'N/A',
      uploadedBy: resource.uploadedBy,
      uploadedAt: new Date().toISOString(),
      category: resource.category || 'General Resources'
    };

    group.resourceLibrary.push(newRes);
    saveCollabData(data);
    broadcastToRoom(resource.uploadedBy, groupId, 'resources_updated', { groupId, resources: group.resourceLibrary });
    res.json(newRes);
  });

  // Profile Update
  app.post('/api/collaboration/profile', (req, res) => {
    const { userId, name, university, department, semester, skills, interests, availability, privacy, bio, username, email } = req.body;
    const data = loadCollabData();
    const user = data.users.find((u: any) => u.id === userId);

    if (user) {
      if (name) user.name = name;
      if (university) user.university = university;
      if (department) user.department = department;
      if (semester) user.semester = semester;
      if (skills) user.skills = skills;
      if (interests) user.interests = interests;
      if (availability) user.availability = availability;
      if (privacy) user.privacy = privacy;
      if (bio !== undefined) user.bio = bio;
      if (username) {
        let formattedUsername = username.trim();
        if (!formattedUsername.startsWith('@')) {
          formattedUsername = '@' + formattedUsername;
        }
        user.username = formattedUsername;
      }
      if (email) user.email = email.trim();

      saveCollabData(data);
      broadcastUserStatus(userId, availability || user.availability);
      
      // Broadcast entire user change
      activeConnections.forEach((conn) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ type: 'profile_updated', payload: user }));
        }
      });

      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Connection/Friend request endpoint
  app.post('/api/collaboration/connect', (req, res) => {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    const data = loadCollabData();
    const sender = data.users.find((u: any) => u.id === senderId);
    const receiver = data.users.find((u: any) => u.id === receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'Sender or Receiver not found' });
    }

    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    if (receiver.friendRequests.some((r: any) => r.senderId === senderId)) {
      return res.status(400).json({ error: 'Request already pending' });
    }

    receiver.friendRequests.push({ senderId, status: 'pending', timestamp: new Date().toISOString() });
    
    const newNotif = {
      id: `not_${Date.now()}`,
      message: `New friend request from ${sender.name} (${sender.username})`,
      timestamp: new Date().toISOString(),
      read: false,
      senderId
    };
    data.notifications.unshift(newNotif);

    saveCollabData(data);

    activeConnections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify({ type: 'connect_updated', payload: { users: data.users, notifications: data.notifications } }));
      }
    });

    res.json({ success: true, message: 'Request sent successfully' });
  });

  // Accept Connection/Friend request
  app.post('/api/collaboration/connect/accept', (req, res) => {
    const { userId, senderId } = req.body;
    if (!userId || !senderId) {
      return res.status(400).json({ error: 'userId and senderId are required' });
    }

    const data = loadCollabData();
    const user = data.users.find((u: any) => u.id === userId);
    const sender = data.users.find((u: any) => u.id === senderId);

    if (!user || !sender) {
      return res.status(404).json({ error: 'User or Sender not found' });
    }

    user.friendRequests = user.friendRequests.filter((r: any) => r.senderId !== senderId);

    if (!user.friends.includes(senderId)) {
      user.friends.push(senderId);
    }
    if (!sender.friends.includes(userId)) {
      sender.friends.push(userId);
    }

    const newNotifUser = {
      id: `not_acc_user_${Date.now()}`,
      message: `You are now connected with ${sender.name}`,
      timestamp: new Date().toISOString(),
      read: false,
      senderId
    };
    const newNotifSender = {
      id: `not_acc_send_${Date.now()}`,
      message: `${user.name} accepted your friend request!`,
      timestamp: new Date().toISOString(),
      read: false,
      senderId: userId
    };
    data.notifications.unshift(newNotifUser, newNotifSender);

    saveCollabData(data);

    activeConnections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify({ type: 'connect_updated', payload: { users: data.users, notifications: data.notifications } }));
      }
    });

    res.json({ success: true, message: 'Friend request accepted' });
  });

  // Decline Connection/Friend request
  app.post('/api/collaboration/connect/decline', (req, res) => {
    const { userId, senderId } = req.body;
    if (!userId || !senderId) {
      return res.status(400).json({ error: 'userId and senderId are required' });
    }

    const data = loadCollabData();
    const user = data.users.find((u: any) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.friendRequests = user.friendRequests.filter((r: any) => r.senderId !== senderId);

    saveCollabData(data);

    activeConnections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify({ type: 'connect_updated', payload: { users: data.users, notifications: data.notifications } }));
      }
    });

    res.json({ success: true, message: 'Friend request declined' });
  });

  // --- COLLABORATION HUB AI HELPER ---
  app.post('/api/collaboration/ai', async (req, res) => {
    try {
      const { command, groupId, receiverId, contextText } = req.body;
      
      if (!ai) {
        return res.status(500).json({ error: 'Gemini API is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.' });
      }

      const data = loadCollabData();
      let prompt = '';
      let chatHistoryText = '';

      if (groupId) {
        const group = data.studyGroups.find((g: any) => g.id === groupId);
        if (group) {
          const recentMsgs = group.messages.slice(-20);
          chatHistoryText = recentMsgs.map((m: any) => {
            const sender = data.users.find((u: any) => u.id === m.senderId);
            return `[${m.timestamp}] ${sender ? sender.name : 'Unknown'}: ${m.text}`;
          }).join('\n');
        }
      } else if (receiverId) {
        const recentMsgs = data.directMessages
          .filter((m: any) => (m.senderId === 'user_me' && m.receiverId === receiverId) || (m.senderId === receiverId && m.receiverId === 'user_me'))
          .slice(-20);
        chatHistoryText = recentMsgs.map((m: any) => {
          const sender = data.users.find((u: any) => u.id === m.senderId);
          return `[${m.timestamp}] ${sender ? sender.name : 'Unknown'}: ${m.text}`;
        }).join('\n');
      }

      if (command === 'summarize') {
        prompt = `You are the LifeOS Academic AI Assistant. Summarize today's discussion from the following recent chat history of our student group.
Focus on key ideas, topics discussed, and agreements reached. Keep it highly academic, professional, and clear.
Use clean markdown with bullet points.

Chat History:
${chatHistoryText}
`;
      } else if (command === 'minutes') {
        prompt = `You are the LifeOS Academic AI Assistant. Generate official meeting minutes and action items from the following recent chat history of our student group.
Format it beautifully as Markdown, including:
1. Meeting Overview
2. Key Discussions Summary
3. Decisions Made
4. Action Items (with responsible members)

Chat History:
${chatHistoryText}
`;
      } else if (command === 'tasks') {
        prompt = `You are the LifeOS Academic AI Assistant. Analyze the following student group discussion and extract actionable tasks that should be added to our group task board.
You must return a JSON array of tasks, wrapped inside a <TASK_BLOCK>...</TASK_BLOCK> tag.
Format of each task in the JSON:
{
  "title": "Short title",
  "description": "More details",
  "priority": "low" | "medium" | "high" | "urgent",
  "deadline": "YYYY-MM-DD"
}

Ensure the deadline uses 2026-07-25 as baseline context for upcoming days.

Chat Discussion:
${chatHistoryText}
`;
      } else if (command === 'explain_code') {
        prompt = `You are the LifeOS Academic AI Assistant. Explain this code snippet shared in our study group in a simple, clear way.
Highlight how it works, potential bugs, and suggestions for improvement. Use markdown formatting with syntax highlighting.

Code to explain:
${contextText || '(No code provided)'}
`;
      } else if (command === 'study_plan') {
        prompt = `You are the LifeOS Academic AI Assistant. Create a customized academic study plan based on the topics, files, or discussions shared.
Use beautiful markdown with a structured timeline (Week-by-week or Day-by-day), reference materials, and milestones.

Group context/discussion:
${chatHistoryText}
${contextText ? `Extra Context: ${contextText}` : ''}
`;
      } else {
        prompt = `You are the LifeOS Academic AI Assistant. Answer this student's questions regarding their study session.
Query: ${contextText || ''}

Chat Discussion for Context:
${chatHistoryText}
`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.5,
        }
      });

      const text = response.text || "I was unable to process this request.";
      
      if (command === 'tasks' && groupId) {
        try {
          const match = text.match(/<TASK_BLOCK>([\s\S]*?)<\/TASK_BLOCK>/);
          if (match) {
            const extractedTasks = JSON.parse(match[1].trim());
            const groupIndex = data.studyGroups.findIndex((g: any) => g.id === groupId);
            if (groupIndex !== -1 && Array.isArray(extractedTasks)) {
              const newTasks = extractedTasks.map((t: any) => ({
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: t.title || 'Action Item',
                description: t.description || '',
                priority: t.priority || 'medium',
                deadline: t.deadline || '2026-07-25',
                status: 'todo',
                assignedTo: []
              }));
              data.studyGroups[groupIndex].tasks.push(...newTasks);
              saveCollabData(data);
              broadcastToRoom('system', groupId, 'tasks_updated', { groupId, tasks: data.studyGroups[groupIndex].tasks });
            }
          }
        } catch (e) {
          console.error('Error parsing extracted tasks:', e);
        }
      }

      return res.json({ text });
    } catch (error: any) {
      console.error('Collaboration AI Error:', error);
      return res.status(500).json({ error: error.message || 'Error processing collaboration AI' });
    }
  });

  // --- WEBSOCKET SERVER INITIALIZATION ---
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeOS fullstack server listening on http://0.0.0.0:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let conn: ActiveConnection = { ws, userId: '' };

    ws.on('message', (messageStr) => {
      try {
        const data = JSON.parse(messageStr.toString());
        const { type, payload } = data;

        switch (type) {
          case 'register':
            conn.userId = payload.userId;
            // Filter stale connections
            activeConnections = activeConnections.filter(c => c.userId !== payload.userId);
            activeConnections.push(conn);
            broadcastUserStatus(payload.userId, 'online');
            break;

          case 'join_room':
            conn.roomId = payload.roomId;
            break;

          case 'typing':
            broadcastToRoom(conn.userId, conn.roomId, 'typing', {
              userId: conn.userId,
              isTyping: payload.isTyping
            });
            break;
        }
      } catch (err) {
        console.error('WS parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (conn.userId) {
        activeConnections = activeConnections.filter(c => c !== conn);
        setTimeout(() => {
          if (!activeConnections.some(c => c.userId === conn.userId)) {
            broadcastUserStatus(conn.userId, 'offline');
          }
        }, 5000);
      }
    });
  });

  // Vite Integration for full-stack App
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start fullstack server:', err);
});
