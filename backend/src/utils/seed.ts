import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { MenuItem } from '../models/MenuItem';
import { Settings } from '../models/Settings';
import { logger } from './logger';

async function seed() {
  await connectDatabase();
  logger.info('Seeding database...');

  await Promise.all([User.deleteMany({}), MenuItem.deleteMany({}), Settings.deleteMany({})]);

  await Settings.create({ singletonKey: 'GLOBAL', totalCounters: 2, averagePrepBufferMinutes: 1 });

  await User.create([
    {
      name: 'Admin User',
      email: 'admin@qserve.dev',
      password: 'Admin@1234',
      role: 'admin',
    },
    {
      name: 'Counter Staff',
      email: 'staff@qserve.dev',
      password: 'Staff@1234',
      role: 'staff',
      counterAssigned: 1,
    },
    {
      name: 'Asha Verma',
      email: 'student@qserve.dev',
      password: 'Student@1234',
      role: 'student',
      studentId: 'CS21B045',
    },
  ]);

  await MenuItem.create([
    {
      name: 'Masala Dosa',
      description: 'Crisp rice crepe filled with spiced potato masala, served with chutney and sambar.',
      category: 'Breakfast',
      price: 60,
      prepTimeMinutes: 8,
      stock: 40,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600',
    },
    {
      name: 'Idli Sambar',
      description: 'Steamed rice cakes with lentil sambar and coconut chutney.',
      category: 'Breakfast',
      price: 40,
      prepTimeMinutes: 5,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
    },
    {
      name: 'Veg Thali',
      description: 'Complete meal with rice, roti, dal, sabzi, salad, and papad.',
      category: 'Meals',
      price: 90,
      prepTimeMinutes: 10,
      stock: 30,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    },
    {
      name: 'Chicken Biryani',
      description: 'Fragrant basmati rice layered with spiced chicken and fried onions.',
      category: 'Meals',
      price: 130,
      prepTimeMinutes: 12,
      stock: 25,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
    },
    {
      name: 'Samosa (2 pcs)',
      description: 'Crispy pastry filled with spiced potatoes and peas.',
      category: 'Snacks',
      price: 30,
      prepTimeMinutes: 3,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
    },
    {
      name: 'Veg Sandwich',
      description: 'Grilled sandwich with fresh vegetables and mint chutney.',
      category: 'Snacks',
      price: 45,
      prepTimeMinutes: 6,
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600',
    },
    {
      name: 'Masala Chai',
      description: 'Spiced Indian tea brewed with milk.',
      category: 'Beverages',
      price: 15,
      prepTimeMinutes: 3,
      stock: 100,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600',
    },
    {
      name: 'Cold Coffee',
      description: 'Chilled coffee blended with milk and ice cream.',
      category: 'Beverages',
      price: 50,
      prepTimeMinutes: 4,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600',
    },
    {
      name: 'Combo: Dosa + Chai',
      description: 'Masala Dosa paired with a hot cup of masala chai.',
      category: 'Combos',
      price: 70,
      prepTimeMinutes: 8,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600',
    },
    {
      name: 'Combo: Biryani + Cold Drink',
      description: 'Chicken Biryani with a chilled soft drink.',
      category: 'Combos',
      price: 150,
      prepTimeMinutes: 12,
      stock: 20,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600',
    },
  ]);

  logger.info('Seed complete. Demo accounts:');
  logger.info('  Admin -> admin@qserve.dev / Admin@1234');
  logger.info('  Staff -> staff@qserve.dev / Staff@1234');
  logger.info('  Student -> student@qserve.dev / Student@1234');

  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
