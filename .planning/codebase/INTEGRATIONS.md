# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**None detected.**

This is a pure documentation repository with no application code and no API integrations. The repository contains *research about* AI services and platforms, but does not integrate with any of them.

## Data Storage

**Databases:**
- None - All data is stored as Markdown files on the local filesystem

**File Storage:**
- Local filesystem only (explicitly stated in `PRD.md` section 8.2)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None - Single-user, local-only repository
- Git authentication is the only external auth (for push/pull to remote)

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- None

## CI/CD & Deployment

**Hosting:**
- Local filesystem; Git remote for backup/versioning
- No deployment pipeline

**CI Pipeline:**
- None detected (no GitHub Actions, no CI config files)

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- No secrets required or stored

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Note on Repository Content

The repository documents and researches the following external services, but does **not** integrate with them programmatically:

- **Cloud AI Platforms:** AWS SageMaker AI (`cloud-ai-platforms/aws-sagemaker-ai.md`), Azure Foundry AI (`cloud-ai-platforms/azure-foundry-ai.md`), Google Vertex AI (`cloud-ai-platforms/google-vertex-ai.md`)
- **AI Tools & Services:** LangChain (`ai-tools-and-services/langchain.md`), LlamaIndex (`ai-tools-and-services/llamaindex.md`), n8n (`ai-tools-and-services/n8n.md`), OpenRouter (`ai-tools-and-services/openrouter.md`), LiteLLM (`ai-tools-and-services/litellm.md`), Weaviate (`ai-tools-and-services/weaviate.md`), Langflow (`ai-tools-and-services/langflow.md`), Lovable (`ai-tools-and-services/lovable.md`), AirLLM (`ai-tools-and-services/airllm.md`)
- **Companies:** AI Foundry (`companies/ai-foundry.md`)

These are research subjects, not runtime dependencies.

---

*Integration audit: 2026-03-09*
