import { Injectable } from "@nestjs/common";
import { AiCapability } from "@prisma/client";
import { AiProvider, AiProviderRequest, AiProviderResponse } from "./ai-provider.interface";

@Injectable()
export class StubAiProviderService implements AiProvider {
  async run(request: AiProviderRequest): Promise<AiProviderResponse> {
    const started = Date.now();

    const input = request.input ?? {};
    const fileName = typeof input["fileName"] === "string" ? input["fileName"] : "";
    const fileNameLower = fileName.toLowerCase();

    let output: Record<string, unknown>;

    const looksLikeInvoice = /\binvoice\b|rechnung|bill/.test(fileNameLower);

    if (request.capability === AiCapability.DOCUMENT_ANALYSIS) {
      output = {
        documentType: looksLikeInvoice ? "invoice" : "unknown",
        confidence: looksLikeInvoice ? 0.92 : 0.55,
        reasoning: looksLikeInvoice
          ? "Filename suggests an invoice-like document."
          : "Insufficient signals in stub mode; defaulting to unknown."
      };
    } else if (request.capability === AiCapability.INVOICE_ANALYSIS) {
      output = {
        invoiceNumber: looksLikeInvoiceNumber(fileName),
        invoiceDate: "2026-04-01",
        dueDate: "2026-04-15",
        vendorName: "Stub Vendor GmbH",
        totalAmount: 1234.56,
        currency: "EUR",
        lineItems: [
          {
            description: "Stub line item",
            quantity: 1,
            unitPrice: 1234.56,
            lineTotal: 1234.56
          }
        ],
        confidence: 0.7
      };
    } else if (request.capability === AiCapability.COMMUNICATION_ASSIST) {
      const task = typeof input["task"] === "string" ? input["task"] : "triage";
      const subject = typeof input["subject"] === "string" ? input["subject"] : "";
      const lastMessages = Array.isArray(input["lastMessages"]) ? input["lastMessages"] : [];
      const messageText = lastMessages
        .map((m) => (m && typeof m === "object" ? (m as Record<string, unknown>)["bodyText"] : null))
        .filter((t) => typeof t === "string")
        .join("\n");

      const combined = `${subject}\n${messageText}`.toLowerCase();
      const hasUrgent = /\burgent\b|asap|immediately|right away/.test(combined);
      const hasMaintenance = /\bleak\b|\bwater\b|\bbroken\b|\brepair\b|\bmold\b|\bheating\b|\bplumbing\b/.test(
        combined
      );
      const hasBilling = /\binvoice\b|\bpayment\b|\bcharge\b|\bbill\b|\brefund\b/.test(combined);
      const hasLease = /\blease\b|\brent\b|\bcontract\b/.test(combined);
      const hasComplaint = /\bcomplaint\b|\bunhappy\b|\bterrible\b|\bnot acceptable\b/.test(combined);

      if (task === "summary") {
        const summarySubject = subject.trim().length > 0 ? subject.trim() : "No subject";
        const firstSnippet =
          messageText.trim().length > 0 ? messageText.trim().slice(0, 160) : "No message body";
        const summary = `${summarySubject}. ${firstSnippet}`.trim();
        const keyPoints = [
          hasMaintenance ? "Issue relates to maintenance/repair" : null,
          hasBilling ? "Conversation mentions billing/payment" : null,
          hasUrgent ? "Sender indicates urgency" : null
        ].filter((x): x is string => Boolean(x));

        output = {
          summary,
          keyPoints,
          confidence: 0.65
        };
      } else {
        let topic: string = "other";
        if (hasMaintenance) topic = "maintenance";
        else if (hasBilling) topic = "billing";
        else if (hasLease) topic = "lease";
        else if (hasComplaint) topic = "complaint";
        else topic = "general";

        let urgency: string = "low";
        if (hasUrgent) urgency = "urgent";
        else if (hasMaintenance) urgency = "high";
        else if (hasBilling) urgency = "medium";
        else urgency = "low";

        output = {
          topic,
          urgency,
          recommendedCaseType: topic === "maintenance" ? "MAINTENANCE" : topic === "billing" ? "BILLING" : null,
          recommendedPriority: urgency,
          reasoning: hasMaintenance
            ? "Detected maintenance-related keywords in subject/body."
            : hasBilling
              ? "Detected billing-related keywords in subject/body."
              : "General communication; no strong signals in stub mode.",
          confidence: hasMaintenance || hasBilling || hasUrgent ? 0.75 : 0.55
        };
      }
    } else if (request.capability === AiCapability.APPROVAL_ASSIST) {
      const invoiceNode =
        input && typeof input === "object" && input["invoice"] && typeof input["invoice"] === "object"
          ? (input["invoice"] as Record<string, unknown>)
          : ({} as Record<string, unknown>);

      const vendorNode =
        input && typeof input === "object" && input["vendor"] && typeof input["vendor"] === "object"
          ? (input["vendor"] as Record<string, unknown>)
          : null;

      const totalAmountRaw = invoiceNode["totalAmount"];
      const totalAmount =
        typeof totalAmountRaw === "number"
          ? totalAmountRaw
          : typeof totalAmountRaw === "string"
            ? Number(totalAmountRaw)
            : 0;

      const vendorName = vendorNode && typeof vendorNode["name"] === "string" ? vendorNode["name"] : "";
      const vendorLower = vendorName.toLowerCase();

      const highValue = Number.isFinite(totalAmount) && totalAmount >= 5000;
      const riskKeyword = /\bconstruction\b|\bemergency\b|\bafter hours\b/.test(vendorLower);

      output = {
        recommendedApproverRoles: highValue ? ["finance", "admin"] : ["finance"],
        recommendedApproverUserIds: [],
        recommendedFlowType: highValue || riskKeyword ? "multi_step" : "single_step",
        reasoning: highValue
          ? "Invoice total suggests higher-risk spend; recommending finance + admin."
          : "Invoice total suggests standard spend; recommending finance.",
        confidence: highValue || riskKeyword ? 0.78 : 0.62
      };
    } else {
      output = {
        provider: request.providerName,
        model: request.modelName,
        capability: request.capability,
        echoedInput: request.input,
        suggestions: [
          {
            type: "GENERIC",
            summary: `Stub suggestion for capability ${request.capability}`,
            rationale: "Generated by local stub provider"
          }
        ]
      };
    }

    const latencyMs = Math.max(1, Date.now() - started);
    const confidenceScore =
      typeof output["confidence"] === "number" ? (output["confidence"] as number) : 0.5;
    return {
      output,
      confidenceScore,
      latencyMs,
      providerMetadata: {
        stub: true,
        tokenUsage: { promptTokens: 0, completionTokens: 0 }
      }
    };
  }
}

function looksLikeInvoiceNumber(fileName: string): string {
  const match = fileName.match(/(\d{4,})/);
  return match ? `INV-${match[1]}` : "INV-0001";
}
