import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { authConfig } from "./config/auth.config";
import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { redisConfig } from "./config/redis.config";
import { temporalConfig } from "./config/temporal.config";
import { PrismaModule } from "./database/prisma/prisma.module";
import { LoggerModule } from "./infrastructure/logging/logger.module";
import { ObservabilityModule } from "./infrastructure/observability/observability.module";

import { AccessModule } from "./modules/access/access.module";
import { AiModule } from "./modules/ai/ai.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CasesModule } from "./modules/cases/cases.module";
import { CommunicationsModule } from "./modules/communications/communications.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { OwnersModule } from "./modules/owners/owners.module";
import { PortalModule } from "./modules/portal/portal.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { UsersModule } from "./modules/users/users.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, appConfig, databaseConfig, temporalConfig, redisConfig]
    }),
    LoggerModule,
    ObservabilityModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    AccessModule,
    PropertiesModule,
    OrganizationsModule,
    OwnersModule,
    TenantsModule,
    VendorsModule,
    DocumentsModule,
    CommunicationsModule,
    CasesModule,
    WorkOrdersModule,
    TasksModule,
    InvoicesModule,
    ApprovalsModule,
    WorkflowsModule,
    AiModule,
    IntegrationsModule,
    AuditModule,
    NotificationsModule,
    PortalModule
  ]
})
export class AppModule {}
