const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@yourcompany.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.SEED_ADMIN_NAME || 'Metin';

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Seed tamamlandı: SUPER_ADMIN oluşturuldu`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Şifre: ${password}`);
}

main()
  .catch((err) => {
    console.error('Seed hatası:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
