---
title: ClawdBot
date: 2026-03-11
tags: [open-source, agent, automation, integration, chat, workflow]
---
# ClawdBot

## Summary
ClawdBot (also known as OpenClaw) is an open-source, self-hosted personal AI assistant that goes beyond conversation to execute real-world tasks — managing emails, calendars, smart home devices, and terminal commands. Created by Peter Steinberger (founder of PSPDFKit), it runs locally as a gateway connecting your preferred LLM to 20+ messaging platforms including WhatsApp, Telegram, Slack, and iMessage. Its privacy-first, local-execution model with MIT licensing makes it a compelling alternative to cloud-locked AI assistants for practitioners who want full control.

## Content

### Architecture
ClawdBot runs as a local-first WebSocket gateway (`ws://127.0.0.1:18789`) that coordinates between messaging channels, an agent runtime (Pi), CLI tools, and companion apps. It supports multi-agent routing with isolated workspaces, model failover with OAuth and API key rotation, and DM-level security defaults via a pairing-based access control system.

### Supported Messaging Platforms
WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage (via BlueBubbles), IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, and WebChat.

### Key Capabilities
- Execute terminal commands and run scripts on the fly
- Install skills dynamically to gain new capabilities
- Set up MCP (Model Context Protocol) servers for external integrations
- Voice input/output via ElevenLabs or system TTS/STT fallbacks (wake words on macOS/iOS, continuous voice on Android)
- Device node integration for camera, screen recording, location, and notifications on iOS and Android
- Agent-driven canvas with A2UI for dynamic UI rendering

### LLM Support
Works with any LLM via API key: Claude, GPT-4, Gemini, or local models. Supports API key rotation and model failover for reliability.

### Installation
- **Runtime**: Node.js ≥ 22
- **Package managers**: npm, pnpm, or bun
- **Quickstart**: `openclaw onboard --install-daemon`
- Can also run headlessly on Linux for remote deployment scenarios

### Privacy Model
All processing happens on your own hardware by default. Unknown senders require pairing codes before the agent processes their messages. Public DM access requires explicit allowlist configuration.

## References
- https://github.com/clawdbot/clawdbot
- https://github.com/openclaw/openclaw
- https://clawd.bot/
- https://www.docker.com/blog/clawdbot-docker-model-runner-private-personal-ai/
- https://medium.com/data-science-in-your-pocket/what-is-clawdbot-the-viral-ai-assistant-b432d275de66
