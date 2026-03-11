---
title: DeepSeek
date: 2026-03-11
tags: [llm, open-source, inference, optimization, agent]
---
# DeepSeek

## Summary
DeepSeek is a Chinese AI research lab (founded July 2023, backed by hedge fund High-Flyer) that develops large language models rivaling GPT-4 and Claude at a fraction of the cost. Its models are released under the MIT license and use a Mixture-of-Experts (MoE) architecture that activates only a subset of parameters per token, enabling dramatically cheaper training and inference. DeepSeek sent shockwaves through the industry by training DeepSeek-V3 for ~$6M — compared to ~$100M for GPT-4 — while matching or exceeding frontier model performance on coding and math benchmarks.

## Content

### Company Background
- **Founded**: July 2023 by Liang Wenfeng (also CEO)
- **Headquarters**: Hangzhou, Zhejiang, China
- **Funding**: Owned and funded by High-Flyer, a Chinese quantitative hedge fund
- **License**: MIT (weights, code, and research papers are fully open)

### Model Lineup

#### DeepSeek-V3
The core generalist model. 671B total parameters in a MoE architecture with 37B activated per token. Trained on 2.788M H800 GPU hours. Pioneers auxiliary-loss-free load balancing and multi-token prediction. Outperforms GPT-4.5 on coding and math benchmarks. Uses Multi-head Latent Attention (MLA) for efficient inference.

#### DeepSeek-R1
A dedicated reasoning model built on top of V3 via reinforcement learning. Achieves OpenAI o1-level performance on mathematical proofs, algorithmic logic, and formal reasoning. 671B parameters, 164K context length. Additional training cost ~$294K beyond the base model.

#### DeepSeek-V3.2 / V3.2-Speciale
Late 2025 releases targeting frontier-level reasoning. V3.2-Speciale achieved gold-medal performance in the 2025 International Mathematical Olympiad (IMO) and International Olympiad in Informatics (IOI). Matches or surpasses GPT-5 on high-end reasoning tasks.

#### DeepSeek-V4 (upcoming)
Expected mid-2026. Context windows exceeding 1M tokens enabling full codebase ingestion and repository-level reasoning.

### Architecture Highlights
- **MoE (Mixture-of-Experts)**: Only 37B of 671B parameters activated per token — dramatically reduces FLOPs vs. dense models
- **Multi-head Latent Attention (MLA)**: Compresses KV cache for efficient long-context inference
- **Auxiliary-loss-free load balancing**: Improves MoE routing stability without auxiliary training losses
- **Multi-token prediction**: Strengthens reasoning and generation quality

### Cost Efficiency
- Training V3: ~$6M total (vs. ~$100M for GPT-4)
- API pricing: as low as $0.27/1M input tokens (cache miss) — 10–30x cheaper than comparable proprietary models
- "Thinking in Tool-Use": agent reasoning before tool calls with self-correction if outputs are inconsistent

### Use Cases for AI/ML Practitioners
- Drop-in replacement for GPT-4/Claude in cost-sensitive pipelines via OpenAI-compatible API
- Self-hosting on Ollama, vLLM, or llama.cpp (weights available on Hugging Face)
- Reasoning-heavy workloads: math, code generation, formal verification
- Fine-tuning base for domain-specific models (MIT license permits commercial use)

## References
- https://github.com/deepseek-ai/DeepSeek-V3
- https://huggingface.co/deepseek-ai/DeepSeek-V3
- https://en.wikipedia.org/wiki/DeepSeek
- https://www.helicone.ai/blog/deepseek-v3
- https://intuitionlabs.ai/articles/deepseek-inference-cost-explained
