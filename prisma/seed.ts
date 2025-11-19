import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();

  // Create authors
  const author1 = await prisma.author.create({
    data: {
      name: "George Orwell",
      bio: "English novelist, essayist, journalist, and critic. Best known for his dystopian novel 1984 and allegorical novella Animal Farm.",
    },
  });

  const author2 = await prisma.author.create({
    data: {
      name: "J.K. Rowling",
      bio: "British author best known for writing the Harry Potter fantasy series, which has won multiple awards and sold more than 500 million copies.",
    },
  });

  const author3 = await prisma.author.create({
    data: {
      name: "Isaac Asimov",
      bio: "American writer and professor of biochemistry, prolific author of science fiction and popular science books.",
    },
  });

  // Create books
  await prisma.book.create({
    data: {
      title: "1984",
      description:
        "A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism.",
      publishedYear: 1949,
      authorId: author1.id,
    },
  });

  await prisma.book.create({
    data: {
      title: "Animal Farm",
      description:
        "An allegorical novella reflecting events leading up to the Russian Revolution and the Stalinist era of the Soviet Union.",
      publishedYear: 1945,
      authorId: author1.id,
    },
  });

  await prisma.book.create({
    data: {
      title: "Harry Potter and the Philosopher's Stone",
      description:
        "The first novel in the Harry Potter series, following Harry Potter's first year at Hogwarts School of Witchcraft and Wizardry.",
      publishedYear: 1997,
      authorId: author2.id,
    },
  });

  await prisma.book.create({
    data: {
      title: "Harry Potter and the Chamber of Secrets",
      description:
        "The second novel in the Harry Potter series, where Harry returns to Hogwarts for his second year.",
      publishedYear: 1998,
      authorId: author2.id,
    },
  });

  await prisma.book.create({
    data: {
      title: "Foundation",
      description:
        "A science fiction novel about the fall of a Galactic Empire and the establishment of the Foundation to preserve knowledge.",
      publishedYear: 1951,
      authorId: author3.id,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`Created ${await prisma.author.count()} authors`);
  console.log(`Created ${await prisma.book.count()} books`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
