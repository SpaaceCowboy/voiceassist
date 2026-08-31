import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const now = new Date();
const result = await prisma.article.updateMany({
  where: { published: false, scheduledAt: { lte: now } },
  data: { published: true, publishedAt: now, scheduledAt: null },
});
console.log(`Published ${result.count} scheduled article(s).`);
await prisma.$disconnect();
