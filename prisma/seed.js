require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const korean = await prisma.restaurant.create({
    data: {
      name: "든든한 한식당",
      category: "한식",
      menus: {
        create: [
          { name: "김치찌개", price: 8000 },
          { name: "제육덮밥", price: 9000 },
          { name: "된장찌개", price: 7500 },
        ],
      },
    },
  });

  const chinese = await prisma.restaurant.create({
    data: {
      name: "빠른 중식당",
      category: "중식",
      menus: {
        create: [
          { name: "짜장면", price: 7000 },
          { name: "짬뽕", price: 8000 },
          { name: "탕수육", price: 18000 },
        ],
      },
    },
  });

  const pizza = await prisma.restaurant.create({
    data: {
      name: "피자타운",
      category: "피자",
      menus: {
        create: [
          { name: "치즈피자", price: 15000 },
          { name: "페퍼로니피자", price: 17000 },
          { name: "불고기피자", price: 19000 },
        ],
      },
    },
  });

  console.log("Seed data inserted.");
  console.log({ korean, chinese, pizza });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });