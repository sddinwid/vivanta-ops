import * as bcrypt from "bcryptjs";
import {
  AiCapability,
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
      ["portal.read", "Read owner-safe portal projections"],
      ["ai.read", "Read AI runs, suggestions, and AI metadata"],
      ["ai.write", "Create AI runs and apply AI suggestions"],
      ["ai.observe", "Observe AI usage and summary analytics"],
      ["ai.evaluate", "Create AI evaluations on runs and suggestions"],
      ["ai.admin", "Manage AI provider and prompt configuration"]
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
      "portal.read",
      "ai.read",
      "ai.write",
      "ai.observe",
      "ai.evaluate",
      "ai.admin"
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
      "workflow.read",
      "ai.read",
      "ai.observe",
      "ai.evaluate"
    ],
    finance: [
      "organization.read",
      "invoice.read",
      "invoice.write",
      "invoice.review",
      "invoice.approve",
      "approval.read",
      "approval.write",
      "workflow.read",
      "ai.read",
      "ai.observe"
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

  // Seed minimal, auditable prompt templates for document AI (assistive-only).
  // These can be edited via the AI admin API later; we just want a safe baseline.
  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "documents.classification", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "documents.classification",
      capability: AiCapability.DOCUMENT_ANALYSIS,
      version: 1,
      systemPrompt: [
        "You are an assistive document classifier.",
        "Classify the uploaded document into one of: invoice, lease, contract, unknown.",
        "Return JSON only with keys: documentType, confidence, reasoning.",
        "confidence must be a number 0.0 to 1.0.",
        "reasoning should be short and optional.",
        "Never claim certainty. This output is non-authoritative."
      ].join("\n"),
      userPromptTemplate: [
        "Document metadata (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
    }
  });

  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "documents.invoice_extraction", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "documents.invoice_extraction",
      capability: AiCapability.INVOICE_ANALYSIS,
      version: 1,
      systemPrompt: [
        "You are an assistive invoice field extraction tool.",
        "Extract invoice-like fields and return JSON only with keys:",
        "invoiceNumber, invoiceDate, dueDate, vendorName, totalAmount, currency, lineItems, confidence.",
        "lineItems must be an array of { description, quantity, unitPrice, lineTotal }.",
        "Dates must be ISO format (YYYY-MM-DD) when present.",
        "confidence must be a number 0.0 to 1.0.",
        "Never claim certainty. This output is non-authoritative."
      ].join("\n"),
      userPromptTemplate: [
        "Document metadata (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
    }
  });

  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "communications.triage", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "communications.triage",
      capability: AiCapability.COMMUNICATION_ASSIST,
      version: 1,
      systemPrompt: [
        "You are an assistive communications triage tool.",
        "Analyze the communication thread and produce a non-authoritative triage suggestion.",
        "Return JSON only with keys: topic, urgency, recommendedCaseType, recommendedPriority, reasoning, confidence.",
        "topic must be one of: maintenance, billing, general, complaint, lease, other.",
        "urgency must be one of: low, medium, high, urgent.",
        "recommendedCaseType and recommendedPriority may be null.",
        "confidence must be a number 0.0 to 1.0.",
        "Never claim certainty."
      ].join("\n"),
      userPromptTemplate: [
        "Thread context (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
    }
  });

  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "communications.summary", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "communications.summary",
      capability: AiCapability.COMMUNICATION_ASSIST,
      version: 1,
      systemPrompt: [
        "You are an assistive communications summarization tool.",
        "Write a short factual summary of the thread and list key points.",
        "Return JSON only with keys: summary, keyPoints, confidence.",
        "keyPoints must be an array of short strings.",
        "confidence must be a number 0.0 to 1.0.",
        "Never claim certainty. Do not invent facts."
      ].join("\n"),
      userPromptTemplate: [
        "Thread context (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
    }
  });

  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "invoices.approval_routing", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "invoices.approval_routing",
      capability: AiCapability.APPROVAL_ASSIST,
      version: 1,
      systemPrompt: [
        "You are an assistive approval-routing recommendation tool for invoices.",
        "Recommend approver roles/users and a simple flow type based on the invoice context.",
        "Return JSON only with keys: recommendedApproverRoles, recommendedApproverUserIds, recommendedFlowType, reasoning, confidence.",
        "recommendedFlowType must be: single_step or multi_step.",
        "confidence must be a number 0.0 to 1.0.",
        "Never claim certainty. This output is non-authoritative."
      ].join("\n"),
      userPromptTemplate: [
        "Invoice + approval context (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
    }
  });

  await prisma.aiPromptTemplate.upsert({
    where: { templateKey_version: { templateKey: "cases.recommendation", version: 1 } },
    update: {
      isActive: true
    },
    create: {
      templateKey: "cases.recommendation",
      capability: AiCapability.CASE_ASSIST,
      version: 1,
      systemPrompt: [
        "You are an assistive case categorization and workflow recommendation tool.",
        "Analyze the case context and recommend categorization and next actions.",
        "Return JSON only with keys: recommendedCaseType, recommendedPriority, recommendedNextActions, recommendedWorkflow, reasoning, confidence.",
        "recommendedCaseType must be one of: maintenance, billing, complaint, lease, general, other.",
        "recommendedPriority must be one of: low, medium, high, urgent.",
        "recommendedNextActions must be an array with items from: create_work_order, request_documents, assign_operator, monitor_only.",
        "recommendedWorkflow must be one of: simple, escalation, vendor_dispatch.",
        "confidence must be a number 0.0 to 1.0.",
        "Never claim certainty. This output is non-authoritative."
      ].join("\n"),
      userPromptTemplate: [
        "Case context (JSON):",
        "{{inputJson}}",
        "",
        "Return JSON only."
      ].join("\n"),
      isActive: true
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
