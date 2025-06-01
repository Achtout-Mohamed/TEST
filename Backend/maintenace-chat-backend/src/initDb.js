// src/initDb.js - Enhanced for Maintenance Models
// @ts-nocheck
const connectDB = require('./config/database');
const User = require('./models/User');
const Group = require('./models/Group');
const Conversation = require('./models/Conversation');
const Tag = require('./models/Tag');
const AIIntegration = require('./models/AIIntegration');

// Add new maintenance models
const MaintenanceLog = require('./models/MaintenanceLog');
const EquipmentStatus = require('./models/EquipmentStatus');
const SparePart = require('./models/SparePart');
const MaintenanceSchedule = require('./models/MaintenanceSchedule');

// Connect to MongoDB
connectDB();

const initDb = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Conversation.deleteMany({});
    await Tag.deleteMany({});
    await AIIntegration.deleteMany({});
    
    // Clear maintenance-related collections
    await MaintenanceLog.deleteMany({});
    await EquipmentStatus.deleteMany({});
    await SparePart.deleteMany({});
    await MaintenanceSchedule.deleteMany({});

    console.log('Cleared existing data');

    // Create an admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'Admin',
      password: 'password123', // In production, hash this password
      is_active: true
    });

    console.log('Admin user created');

    // Create a technician user
    const techUser = await User.create({
      name: 'Tech User',
      email: 'tech@example.com',
      role: 'Technician',
      password: 'password123', // In production, hash this password
      is_active: true
    });

    console.log('Technician user created');

    // Create additional maintenance users
    const maintenanceUsers = await User.insertMany([
      {
        name: 'John Mechanic',
        email: 'john@example.com',
        role: 'Technician',
        password: 'password123',
        is_active: true
      },
      {
        name: 'Sara Engineer',
        email: 'sara@example.com',
        role: 'Engineer',
        password: 'password123',
        is_active: true
      }
    ]);

    console.log('Additional maintenance users created');

    // Create maintenance conversation
    const maintenanceConversation = await Conversation.create({
      title: 'Maintenance Chat',
      participants: [adminUser._id, techUser._id, ...maintenanceUsers.map(u => u._id)],
      isShared: false,
      isGroupConversation: true,
      type: 'maintenance' // Special type for maintenance chats
    });

    console.log('Maintenance conversation created');

    // Create a conversation
    const conversation = await Conversation.create({
      title: 'Initial Conversation',
      participants: [adminUser._id, techUser._id],
      isShared: false,
      isGroupConversation: false
    });

    console.log('Conversation created');

    // Create a group
    const group = await Group.create({
      name: 'Maintenance Team',
      description: 'General maintenance team',
      members: [adminUser._id, techUser._id, ...maintenanceUsers.map(u => u._id)],
      admin: adminUser._id,
      conversationId: conversation._id
    });

    console.log('Group created');

    // Update the users with the group
    await User.updateMany(
      { _id: { $in: [adminUser._id, techUser._id, ...maintenanceUsers.map(u => u._id)] } },
      { $push: { teams: group._id } }
    );

    console.log('Users updated with group');

    // Create some tags
    const tags = await Tag.insertMany([
      {
        name: 'Urgent',
        color: '#ff0000',
        creator: adminUser._id
      },
      {
        name: 'Resolved',
        color: '#00ff00',
        creator: adminUser._id
      },
      {
        name: 'Pump Issues',
        color: '#0000ff',
        creator: techUser._id
      },
      // Add maintenance-specific tags
      {
        name: 'Preventive',
        color: '#ffa500',
        creator: adminUser._id
      },
      {
        name: 'Emergency',
        color: '#ff4500',
        creator: adminUser._id
      },
      {
        name: 'Scheduled',
        color: '#9932cc',
        creator: adminUser._id
      }
    ]);

    console.log('Tags created');

    // Set up AI integration
    await AIIntegration.create({
      apiKey: 'your-deepseek-api-key', // Replace with actual key or environment variable
      usageLimit: 100000,
      currentUsage: 0
    });

    console.log('AI integration set up');

    // ============ NEW: Initialize Maintenance Data ============

    // Create Equipment Status entries
    const equipmentList = await EquipmentStatus.insertMany([
      {
        equipmentId: 'PUMP-A',
        name: 'Primary Water Pump A',
        type: 'pump',
        location: 'Building 1, Floor 1',
        status: 'operational',
        lastMaintenanceDate: new Date('2025-05-01'),
        nextMaintenanceDate: new Date('2025-06-01'),
        maintenanceInterval: 30,
        failurePrediction: {
          riskLevel: 'low',
          confidence: 85,
          lastPredicted: new Date()
        },
        specifications: {
          model: 'HydroMax 3000',
          manufacturer: 'PumpCorp',
          serialNumber: 'PC-HM3000-001',
          installationDate: new Date('2024-01-15')
        }
      },
      {
        equipmentId: 'CONV-B',
        name: 'Conveyor Belt B',
        type: 'conveyor',
        location: 'Building 2, Production Line',
        status: 'warning',
        lastMaintenanceDate: new Date('2025-04-15'),
        nextMaintenanceDate: new Date('2025-05-15'),
        maintenanceInterval: 21,
        failurePrediction: {
          riskLevel: 'medium',
          confidence: 72,
          lastPredicted: new Date()
        },
        specifications: {
          model: 'BeltFast 500',
          manufacturer: 'ConveyTech',
          serialNumber: 'CT-BF500-023',
          installationDate: new Date('2023-11-20')
        }
      },
      {
        equipmentId: 'MOTOR-C',
        name: 'Compressor Motor C',
        type: 'motor',
        location: 'Building 1, Basement',
        status: 'critical',
        lastMaintenanceDate: new Date('2025-03-01'),
        nextMaintenanceDate: new Date('2025-05-01'),
        maintenanceInterval: 45,
        failurePrediction: {
          riskLevel: 'high',
          confidence: 91,
          lastPredicted: new Date()
        },
        specifications: {
          model: 'PowerDrive 750',
          manufacturer: 'MotorTech',
          serialNumber: 'MT-PD750-045',
          installationDate: new Date('2022-08-10')
        }
      }
    ]);

    console.log('Equipment status entries created');

    // Create Spare Parts inventory
    await SparePart.insertMany([
      {
        partNumber: 'FILTER-OIL-001',
        name: 'Oil Filter 20mm',
        compatibleEquipment: ['PUMP-A', 'MOTOR-C'],
        currentStock: 15,
        minimumStock: 5,
        cost: 25.99,
        supplier: {
          name: 'FilterPro Supply',
          contact: 'orders@filterpro.com',
          deliveryTime: 2
        },
        lastOrdered: new Date('2025-04-01'),
        lastUsed: new Date('2025-05-01')
      },
      {
        partNumber: 'BELT-CONV-XL',
        name: 'Conveyor Belt XL 500mm',
        compatibleEquipment: ['CONV-B'],
        currentStock: 2,
        minimumStock: 1,
        cost: 275.50,
        supplier: {
          name: 'BeltMaster Inc',
          contact: 'sales@beltmaster.com',
          deliveryTime: 7
        },
        lastOrdered: new Date('2025-03-15'),
        lastUsed: new Date('2025-04-15')
      },
      {
        partNumber: 'BEARING-MT-750',
        name: 'Motor Bearing Set',
        compatibleEquipment: ['MOTOR-C'],
        currentStock: 1,
        minimumStock: 2,
        cost: 189.99,
        supplier: {
          name: 'Bearing Solutions',
          contact: 'support@bearings.com',
          deliveryTime: 5
        },
        lastOrdered: new Date('2025-02-20'),
        lastUsed: new Date('2025-03-01')
      }
    ]);

    console.log('Spare parts inventory created');

    // Create Maintenance Logs with some history
    await MaintenanceLog.insertMany([
      {
        equipment: 'PUMP-A',
        operation: 'Oil Change',
        technician: techUser._id,
        conversationId: maintenanceConversation._id,
        status: 'completed',
        notes: 'Regular scheduled oil change. Used FILTER-OIL-001.',
        priority: 'medium',
        estimatedTime: 60,
        actualTime: 45,
        completedAt: new Date('2025-05-01T10:30:00')
      },
      {
        equipment: 'CONV-B',
        operation: 'Belt Replacement',
        technician: maintenanceUsers[0]._id,
        conversationId: maintenanceConversation._id,
        status: 'completed',
        notes: 'Replaced worn conveyor belt. Used BELT-CONV-XL.',
        priority: 'high',
        estimatedTime: 180,
        actualTime: 200,
        completedAt: new Date('2025-04-15T14:15:00')
      },
      {
        equipment: 'MOTOR-C',
        operation: 'Bearing Inspection',
        technician: maintenanceUsers[1]._id,
        conversationId: maintenanceConversation._id,
        status: 'in-progress',
        notes: 'Detected unusual vibration. Investigating bearing condition.',
        priority: 'critical',
        estimatedTime: 120,
        actualTime: null,
        completedAt: null
      }
    ]);

    console.log('Maintenance logs created');

    // Create Maintenance Schedules
    await MaintenanceSchedule.insertMany([
      {
        equipmentId: 'PUMP-A',
        taskDescription: 'Monthly oil change and filter replacement',
        frequency: 'monthly',
        nextDueDate: new Date('2025-06-01'),
        assignedTechnician: techUser._id,
        estimatedDuration: 60,
        priority: 'medium',
        isActive: true
      },
      {
        equipmentId: 'CONV-B',
        taskDescription: 'Belt tension adjustment and cleaning',
        frequency: 'weekly',
        nextDueDate: new Date('2025-05-20'),
        assignedTechnician: maintenanceUsers[0]._id,
        estimatedDuration: 30,
        priority: 'low',
        isActive: true
      },
      {
        equipmentId: 'MOTOR-C',
        taskDescription: 'Complete overhaul and bearing replacement',
        frequency: 'quarterly',
        nextDueDate: new Date('2025-08-01'),
        assignedTechnician: maintenanceUsers[1]._id,
        estimatedDuration: 480,
        priority: 'high',
        isActive: true
      }
    ]);

    console.log('Maintenance schedules created');

    // ============ END: Maintenance Data ============

    console.log('Database initialized successfully with maintenance data');
    console.log('\nSummary:');
    console.log('- Users: 4 (1 Admin, 3 Technicians/Engineers)');
    console.log('- Equipment: 3 items monitored');
    console.log('- Spare Parts: 3 types in inventory');
    console.log('- Maintenance Logs: 3 records');
    console.log('- Scheduled Tasks: 3 upcoming');
    console.log('- Maintenance Conversation: 1 group chat ready');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }
};

initDb();