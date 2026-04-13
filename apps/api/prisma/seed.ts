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
      ["audit.read", "Read audit events"]
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

  const rolePermissions: Record<string, string[]> = {
    admin: [
      "organization.read",
      "user.read",
      "user.write",
      "role.read",
      "role.write",
      "audit.read"
    ],
    operations: ["organization.read", "user.read", "role.read", "audit.read"],
    owner: ["organization.read"]
  };

  const roles = {
    admin: adminRole.id,
    operations: operationsRole.id,
    owner: ownerRole.id
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const roleId = roles[roleName as keyof typeof roles];
    await Promise.all(
      permissionNames.map(async (permissionName) => {
        const permissionId = permissionByName.get(permissionName);
        if (!permissionId) {
          return;
        }
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId
            }
          },
          update: {},
          create: { roleId, permissionId }
        });
      })
    );
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
