import * as bcrypt from "bcryptjs";
import {
  OrganizationStatus,
  PrismaClient,
  UserStatus,
  UserType
} from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const organization = await prisma.organization.upsert({
    where: { slug: "vivanta-default" },
    update: {},
    create: {
      name: "Vivanta Operations",
      slug: "vivanta-default",
      status: OrganizationStatus.ACTIVE
    }
  });

  const permissions = await Promise.all(
    [
      ["organization.read", "Read organization records"],
      ["user.read", "Read users"],
      ["user.write", "Create/update users"],
      ["role.read", "Read roles and permissions"],
      ["role.write", "Manage roles and user role assignments"],
      ["audit.read", "Read audit events"],
      ["property.read", "Read property, building, and unit records"],
      ["property.write", "Create/update property, building, and unit records"],
      ["owner.read", "Read owner records and ownership links"],
      ["owner.write", "Create/update owner records and ownership links"],
      ["vendor.read", "Read vendor directory records"],
      ["vendor.write", "Create/update vendor directory records"],
      ["document.read", "Read document metadata and linked records"],
      ["document.write", "Upload and update document metadata"],
      ["document.link", "Link/unlink documents to operational entities"],
      ["document.reprocess", "Request document reprocessing"],
      ["communication.read", "Read communication threads and messages"],
      ["communication.write", "Create/update communication threads and messages"],
      ["communication.assign", "Assign communication threads"],
      ["case.read", "Read operational cases"],
      ["case.write", "Create/update operational cases"],
      ["case.assign", "Assign operational cases"],
      ["task.read", "Read operational tasks"],
      ["task.write", "Create/update operational tasks"],
      ["workorder.read", "Read work orders"],
      ["workorder.write", "Create/update work orders"],
      ["workorder.assign", "Assign work order vendors"],
      ["invoice.read", "Read invoice records"],
      ["invoice.write", "Create/update invoice records"],
      ["invoice.review", "Submit and manage invoice review state"],
      ["invoice.approve", "Approve/reject invoices"],
      ["approval.read", "Read approval flows and steps"],
      ["approval.write", "Act on approval flows"],
      ["workflow.read", "Read workflow runs and workflow events"],
      ["workflow.write", "Control workflow retry/cancel actions"],
      ["portal.read", "Read owner-safe portal projections"]
    ].map(([permissionName, description]) =>
      prisma.permission.upsert({
        where: { permissionName },
        update: { description },
        create: { permissionName, description }
      })
    )
  );

  const permissionByName = new Map(
    permissions.map((permission) => [permission.permissionName, permission.id])
  );

  const adminRole = await prisma.role.upsert({
    where: {
      organizationId_roleName: {
        organizationId: organization.id,
        roleName: "admin"
      }
    },
    update: { description: "Full access role" },
    create: {
      organizationId: organization.id,
      roleName: "admin",
      description: "Full access role"
    }
  });

  const operationsRole = await prisma.role.upsert({
    where: {
      organizationId_roleName: {
        organizationId: organization.id,
        roleName: "operations"
      }
    },
    update: { description: "Operations role" },
    create: {
      organizationId: organization.id,
      roleName: "operations",
      description: "Operations role"
    }
  });

  const ownerRole = await prisma.role.upsert({
    where: {
      organizationId_roleName: {
        organizationId: organization.id,
        roleName: "owner"
      }
    },
    update: { description: "Owner-facing role" },
    create: {
      organizationId: organization.id,
      roleName: "owner",
      description: "Owner-facing role"
    }
  });

  const financeRole = await prisma.role.upsert({
    where: {
      organizationId_roleName: {
        organizationId: organization.id,
        roleName: "finance"
      }
    },
    update: { description: "Finance approvals role" },
    create: {
      organizationId: organization.id,
      roleName: "finance",
      description: "Finance approvals role"
    }
  });

  const rolePermissions: Record<string, string[]> = {
    admin: [
      "organization.read",
      "user.read",
      "user.write",
      "role.read",
      "role.write",
      "audit.read",
      "property.read",
      "property.write",
      "owner.read",
      "owner.write",
      "vendor.read",
      "vendor.write",
      "document.read",
      "document.write",
      "document.link",
      "document.reprocess",
      "communication.read",
      "communication.write",
      "communication.assign",
      "case.read",
      "case.write",
      "case.assign",
      "task.read",
      "task.write",
      "workorder.read",
      "workorder.write",
      "workorder.assign",
      "invoice.read",
      "invoice.write",
      "invoice.review",
      "invoice.approve",
      "approval.read",
      "approval.write",
      "workflow.read",
      "workflow.write",
      "portal.read"
    ],
    operations: [
      "organization.read",
      "property.read",
      "property.write",
      "owner.read",
      "owner.write",
      "vendor.read",
      "vendor.write",
      "document.read",
      "document.write",
      "document.link",
      "document.reprocess",
      "communication.read",
      "communication.write",
      "communication.assign",
      "case.read",
      "case.write",
      "case.assign",
      "task.read",
      "task.write",
      "workorder.read",
      "workorder.write",
      "workorder.assign",
      "invoice.read",
      "invoice.write",
      "invoice.review",
      "approval.read",
      "workflow.read"
    ],
    finance: [
      "organization.read",
      "invoice.read",
      "invoice.write",
      "invoice.review",
      "invoice.approve",
      "approval.read",
      "approval.write",
      "workflow.read"
    ],
    owner: ["organization.read", "portal.read"]
  };

  const roles = {
    admin: adminRole.id,
    operations: operationsRole.id,
    finance: financeRole.id,
    owner: ownerRole.id
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const roleId = roles[roleName as keyof typeof roles];
    const resolvedPermissionIds = permissionNames
      .map((permissionName) => permissionByName.get(permissionName))
      .filter((permissionId): permissionId is string => Boolean(permissionId));

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });
      if (resolvedPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: resolvedPermissionIds.map((permissionId) => ({
            roleId,
            permissionId
          })),
          skipDuplicates: true
        });
      }
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@vivanta.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? "System";
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: adminFirstName,
      lastName: adminLastName,
      passwordHash,
      status: UserStatus.ACTIVE,
      userType: UserType.INTERNAL
    },
    create: {
      organizationId: organization.id,
      email: adminEmail,
      passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      status: UserStatus.ACTIVE,
      userType: UserType.INTERNAL
    }
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });
}

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
