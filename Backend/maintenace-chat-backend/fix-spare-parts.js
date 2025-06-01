// fix-spare-parts.js
require('dotenv').config();
const connectDB = require('./src/config/database');
const SparePart = require('./src/models/SparePart');

async function fixSpareParts() {
  try {
    await connectDB();
    
    console.log('Clearing and recreating spare parts with required category field...');
    
    // Clear existing spare parts
    await SparePart.deleteMany({});
    
    // Create spare parts with category field
    await SparePart.insertMany([
      {
        partNumber: 'FILTER-OIL-001',
        name: 'Oil Filter 20mm',
        category: 'filters',
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
        category: 'belts',
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
        category: 'bearings',
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
    
    console.log('✅ Spare parts updated successfully with categories!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing spare parts:', error.message);
    process.exit(1);
  }
}

fixSpareParts();