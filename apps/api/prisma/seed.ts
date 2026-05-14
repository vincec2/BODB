import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const supplierA = await prisma.supplier.upsert({
    where: { name: "Vision Supply Co." },
    update: {},
    create: {
      name: "Vision Supply Co.",
      contactName: "Alex Chen",
      email: "orders@visionsupply.example",
      notes: "Primary supplier for major contact lens brands."
    }
  });

  const supplierB = await prisma.supplier.upsert({
    where: { name: "ClearView Distribution" },
    update: {},
    create: {
      name: "ClearView Distribution",
      contactName: "Maya Patel",
      email: "support@clearview.example",
      notes: "Backup supplier for selected products."
    }
  });

  await prisma.product.upsert({
    where: { sku: "CL-ACUVUE-OASYS-001" },
    update: {
      supplierId: supplierA.id
    },
    create: {
      name: "ACUVUE OASYS 2-Week",
      sku: "CL-ACUVUE-OASYS-001",
      category: "Contact Lenses",
      sellingPrice: 72.99,
      supplierCost: 48.25,
      supplierId: supplierA.id
    }
  });

  await prisma.product.upsert({
    where: { sku: "CL-TOTAL30-001" },
    update: {
      supplierId: supplierA.id
    },
    create: {
      name: "TOTAL30",
      sku: "CL-TOTAL30-001",
      category: "Contact Lenses",
      sellingPrice: 84.99,
      supplierCost: 57.4,
      supplierId: supplierA.id
    }
  });

  await prisma.product.upsert({
    where: { sku: "CL-BIOFINITY-001" },
    update: {
      supplierId: supplierB.id
    },
    create: {
      name: "Biofinity Monthly",
      sku: "CL-BIOFINITY-001",
      category: "Contact Lenses",
      sellingPrice: 69.99,
      supplierCost: 45.75,
      supplierId: supplierB.id
    }
  });

  console.log("Seed data inserted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });