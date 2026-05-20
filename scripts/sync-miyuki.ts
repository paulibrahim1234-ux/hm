import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CHARACTER_DATA } from "../src/lib/characters";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const miyuki = CHARACTER_DATA.find((character) => character.name === "Miyuki Asakura");
  if (!miyuki) throw new Error("Miyuki Asakura character data not found");

  await prisma.character.upsert({
    where: { name: miyuki.name },
    update: {
      subtitle: miyuki.subtitle,
      tags: miyuki.tags,
      description: miyuki.description,
      avatarUrl: miyuki.avatarUrl,
      baseImageUrl: miyuki.baseImageUrl,
      systemPrompt: miyuki.systemPrompt,
      appearance: miyuki.appearance,
      voiceId: miyuki.voiceId,
    },
    create: miyuki,
  });

  const selected = await prisma.character.findUniqueOrThrow({
    where: { name: miyuki.name },
    select: { id: true },
  });

  await prisma.user.updateMany({
    data: { selectedCharacterId: selected.id },
  });

  console.log("Miyuki synced and selected for all users.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
