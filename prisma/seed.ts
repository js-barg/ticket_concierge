import { prisma } from '../lib/db';

async function main() {
  // Phase 1 foundation: no real seed data yet.
  // This script exists to keep the Prisma workflow wired up.
  const count = await prisma.user.count();
  if (count === 0) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Initial Admin',
        role: 'ADMIN',
        isActive: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

