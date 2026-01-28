import { PrismaClient } from 'generated/prisma/client';

export async function seedPlans(prisma: PrismaClient) {
  const plans = [
    {
      id: 'plan_5',
      name: 'Family 5',
      maxMembers: 5,
      priceUSD: 9.99,
      appleProductId: 'com.secureyourself.plan5',
    },
    {
      id: 'plan_10',
      name: 'Family 10',
      maxMembers: 10,
      priceUSD: 19.99,
      appleProductId: 'com.secureyourself.plan10',
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  console.log('✅ Plans seeded successfully');
}
