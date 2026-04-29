import { PrismaClient, ItemType, TransactionType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.stockTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouseDepartmentAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.item.deleteMany();
  await prisma.itemCategory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.department.deleteMany();

  const [it, hr, adminDept, finance] = await Promise.all([
    prisma.department.create({ data: { name: "IT팀" } }),
    prisma.department.create({ data: { name: "인사팀" } }),
    prisma.department.create({ data: { name: "경영지원팀" } }),
    prisma.department.create({ data: { name: "재무팀" } }),
  ]);

  const [mainWh, annexWh] = await Promise.all([
    prisma.warehouse.create({
      data: { code: "WH-TL12F", name: "12F T-러닝 창고", description: "12층 T-러닝 공용 창고" },
    }),
    prisma.warehouse.create({
      data: { code: "WH-P2-KIDS", name: "P2 유아 창고", description: "P2층 유아 전용 창고" },
    }),
  ]);

  await prisma.warehouseDepartmentAccess.createMany({
    data: [
      { warehouseId: mainWh.id, departmentId: it.id },
      { warehouseId: mainWh.id, departmentId: hr.id },
      { warehouseId: mainWh.id, departmentId: adminDept.id },
      { warehouseId: annexWh.id, departmentId: finance.id },
      { warehouseId: annexWh.id, departmentId: adminDept.id },
    ],
  });

  const [locA, locB, locC] = await Promise.all([
    prisma.location.create({ data: { warehouseId: mainWh.id, name: "A-01" } }),
    prisma.location.create({ data: { warehouseId: mainWh.id, name: "A-02" } }),
    prisma.location.create({ data: { warehouseId: annexWh.id, name: "B-01" } }),
  ]);

  const [catOffice, catPc, catFacility] = await Promise.all([
    prisma.itemCategory.create({ data: { name: "사무용품" } }),
    prisma.itemCategory.create({ data: { name: "전산장비" } }),
    prisma.itemCategory.create({ data: { name: "시설" } }),
  ]);

  const items = await Promise.all([
    prisma.item.create({
      data: {
        itemCode: "ITM-0001",
        name: "A4 복사용지",
        type: ItemType.CONSUMABLE,
        categoryId: catOffice.id,
        unit: "박스",
        minStock: 5,
        defaultLocationId: locA.id,
        searchKeywords: "용지,프린터,사무",
      },
    }),
    prisma.item.create({
      data: {
        itemCode: "ITM-0002",
        name: "무선 마우스",
        type: ItemType.EQUIPMENT,
        categoryId: catPc.id,
        unit: "개",
        minStock: 3,
        specification: "USB 리시버",
        defaultLocationId: locB.id,
        searchKeywords: "마우스,PC",
      },
    }),
    prisma.item.create({
      data: {
        itemCode: "ITM-0003",
        name: "멀티탭",
        type: ItemType.EQUIPMENT,
        categoryId: catFacility.id,
        unit: "개",
        minStock: 10,
        specification: "6구",
        defaultLocationId: locC.id,
        searchKeywords: "전기,연장선",
      },
    }),
  ]);

  await prisma.inventory.createMany({
    data: [
      { warehouseId: mainWh.id, itemId: items[0].id, quantity: 18 },
      { warehouseId: mainWh.id, itemId: items[1].id, quantity: 4 },
      { warehouseId: annexWh.id, itemId: items[2].id, quantity: 7 },
    ],
  });

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const deptAdminPassword = await bcrypt.hash("Dept123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);

  const [sysAdmin, itManager, hrUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@company.com",
        name: "시스템관리자",
        role: UserRole.SYSTEM_ADMIN,
        departmentId: adminDept.id,
        passwordHash: adminPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "itmanager@company.com",
        name: "IT팀장",
        role: UserRole.DEPT_ADMIN,
        departmentId: it.id,
        passwordHash: deptAdminPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "hruser@company.com",
        name: "인사팀 사원",
        role: UserRole.USER,
        departmentId: hr.id,
        passwordHash: userPassword,
      },
    }),
  ]);

  await prisma.stockTransaction.createMany({
    data: [
      {
        type: TransactionType.IN,
        warehouseId: mainWh.id,
        itemId: items[0].id,
        actorName: "시스템관리자",
        quantity: 20,
        beforeQty: 0,
        afterQty: 20,
        departmentId: adminDept.id,
        userId: sysAdmin.id,
        note: "초기 재고 등록",
      },
      {
        type: TransactionType.OUT,
        warehouseId: mainWh.id,
        itemId: items[0].id,
        actorName: "인사팀 사원",
        quantity: 2,
        beforeQty: 20,
        afterQty: 18,
        departmentId: hr.id,
        userId: hrUser.id,
        note: "월간 문서 출력용",
      },
      {
        type: TransactionType.ADJUST,
        warehouseId: annexWh.id,
        itemId: items[2].id,
        actorName: "IT팀장",
        quantity: 1,
        beforeQty: 8,
        afterQty: 7,
        departmentId: it.id,
        userId: itManager.id,
        reason: "실물 재고 점검 차이",
      },
    ],
  });

  console.log("Seed 완료");
  console.log("관리자: admin@company.com / Admin123!");
  console.log("부서관리자: itmanager@company.com / Dept123!");
  console.log("일반사용자: hruser@company.com / User123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


