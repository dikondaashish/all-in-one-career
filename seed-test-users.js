const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.findMany();
    console.log(`Found ${existingUsers.length} existing users`);

    if (existingUsers.length > 0) {
      console.log('✅ Users already exist, skipping seed');
      return;
    }

    // Create test users
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'test1@example.com',
        name: 'Test User 1',
        avatarUrl: 'https://via.placeholder.com/150',
        profileImage: null,
        theme: 'LIGHT'
      },
      {
        id: 'test-user-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        avatarUrl: 'https://via.placeholder.com/150',
        profileImage: null,
        theme: 'DARK'
      },
      {
        id: 'test-user-3',
        email: 'test3@example.com',
        name: 'Test User 3',
        avatarUrl: 'https://via.placeholder.com/150',
        profileImage: null,
        theme: 'SYSTEM'
      }
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log(`\n🎉 Successfully seeded ${testUsers.length} test users!`);

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedTestUsers().catch(console.error);
