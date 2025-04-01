// Migration script to associate existing clients with a default admin user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of existing clients...');

  // Create default admin user if it doesn't exist
  const adminEmail = 'admin@example.com';
  
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    console.log('Creating default admin user...');
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
      }
    });
    console.log('Default admin user created.');
  } else {
    console.log('Using existing admin user.');
  }

  // Get all clients
  const clients = await prisma.client.findMany();

  console.log(`Found ${clients.length} clients in total.`);

  if (clients.length > 0) {
    // Update all clients to be associated with the admin user
    let updatedCount = 0;
    
    for (const client of clients) {
      try {
        await prisma.client.update({
          where: { id: client.id },
          data: { userId: adminUser.id }
        });
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update client ${client.id}:`, error);
      }
    }

    console.log(`Successfully updated ${updatedCount} clients to be associated with admin user.`);
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 