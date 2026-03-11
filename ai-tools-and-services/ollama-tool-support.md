---
title: Tool support · Ollama Blog
date: 2026-03-11
tags: [llm, open-source, inference, agent, integration, automation]
---
# Tool support · Ollama Blog

## Summary
Ollama has introduced tool calling capabilities, allowing AI models to access external functions, APIs, and web services to complete complex tasks. This enables developers to build agentic applications with locally-run models like Llama 3.1 and Mistral Nemo, with OpenAI-compatible endpoints making it easy to switch between providers.

## Content

### Tool Calling in Ollama
Developers can provide available tools via the `tools` field in Ollama's API. Supported models respond with `tool_calls` that applications can process to invoke external functions and return results back to the model.

### Supported Models
- Llama 3.1
- Mistral Nemo
- Firefunction v2
- Command-R+

### Use Cases
- Functions and external APIs
- Web browsing
- Code interpretation

### OpenAI Compatibility
Tool calling is also supported through Ollama's OpenAI-compatible endpoint, allowing seamless migration between model providers with minimal code changes.

### Roadmap
- Streaming tool calls for faster action initiation
- Tool choice functionality to enforce specific tool usage

## References
- https://ollama.com/blog/tool-support
