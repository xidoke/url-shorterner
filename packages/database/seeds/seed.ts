import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Start seeding...");

	// TODO: Add seed data here
	// Example:
	// const user = await prisma.user.create({
	//   data: {
	//     email: 'test@example.com',
	//     passwordHash: 'hashed_password',
	//     name: 'Test User',
	//   },
	// });

	console.log("Seeding finished.");
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
