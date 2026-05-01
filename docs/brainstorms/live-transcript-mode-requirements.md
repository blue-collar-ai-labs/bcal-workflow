---
date: 2026-05-01
topic: live-transcript-mode
---

# Live Transcript Mode

## Problem Frame

When a team runs AI-assisted workflows during a video call, one person operates the Claude session on a shared screen. Skills and conversations present questions; the group reads them, discusses aloud, and then the operator must synthesize the group's verbal discussion into a typed response — under social pressure, in real time, while the conversation's energy stalls.

Live Transcript Mode is a standalone skill the operator invokes whenever the team wants to discuss a question aloud rather than type an answer. Claude reads the relevant section of a live Notion transcript, synthesizes the discussion, and returns a clear answer the operator can provide back to whatever workflow prompted the question. Nobody types long responses. Nobody copy-pastes. The conversation doesn't break.

---

## Actors

- A1. Operator: the person running the Claude session on a shared screen during the call. Invokes `/bcal-workflow:live-transcript` when the team wants to discuss a question aloud, and signals when discussion is done.
- A2. Team members: everyone else on the call. They discuss the question aloud. Their words land in the Notion transcript via the meeting bot.
- A3. Claude (skill agent): manages the transcript connection, writes markers via Notion MCP, reads tagged sections, and synthesizes the team's discussion into an answer.
- A4. Notion MCP server: provides read/write access to Notion pages. Used to discover the transcript, write markers, and read content between markers.

---

## Key Flows

- F1. Transcript connection (first-time setup within a session)
  - **Trigger:** Operator invokes `/bcal-workflow:live-transcript` for the first time in a session.
  - **Actors:** A1, A3, A4
  - **Steps:**
    1. Claude searches Notion via MCP for pages matching today's date and transcript naming pattern ("@Today <timestamp>").
    2. If multiple candidates, Claude presents them and the operator picks one. If exactly one, Claude auto-selects it and confirms.
    3. Claude caches the transcript page ID for the remainder of the session.
    4. Claude confirms the connection: "Connected to transcript: [page name]. Live Transcript Mode is ready."
  - **Outcome:** A transcript page is identified and cached. Subsequent invocations skip discovery.
  - **Covered by:** R1, R2, R3

- F2. Live discussion capture
  - **Trigger:** Operator invokes `/bcal-workflow:live-transcript` while a question from any skill or conversation is on screen.
  - **Actors:** A1, A2, A3, A4
  - **Steps:**
    1. If no transcript is connected yet, F1 runs first.
    2. The operator provides the question context (or Claude reads it from the current conversation).
    3. Claude writes a labeled START marker into the transcript page via Notion MCP (e.g., a collapsed toggle block containing `LT:Q3:START`).
    4. Claude displays a "Listening..." indicator so the team knows discussion is being captured.
    5. The team discusses the question. Their words appear in the Notion transcript in near real-time.
    6. The operator signals "done" by typing anything into the Claude session.
    7. Claude writes the corresponding STOP marker into the transcript page (e.g., `LT:Q3:STOP`).
    8. Claude reads the transcript content between the START and STOP markers.
    9. Claude synthesizes the discussion into an answer appropriate to the question type (a menu selection, a text response, or a set of decisions) and presents it to the operator.
  - **Outcome:** The operator receives a synthesized answer they can provide to whatever skill or conversation prompted the question.
  - **Covered by:** R4, R5, R6, R7, R8, R9

- F3. Ambiguous discussion resolution
  - **Trigger:** Claude reads the tagged transcript section and cannot determine a clear answer — e.g., the team disagreed, the discussion wandered, or the response doesn't map to the question.
  - **Actors:** A1, A3
  - **Steps:**
    1. Claude summarizes the tensions or perspectives it identified in the discussion.
    2. Claude presents the perspectives as selectable options, plus an option to re-discuss.
    3. If the operator picks a perspective, Claude feeds that as the answer.
    4. If the operator picks re-discuss, Claude writes a new START marker and the team discusses again (re-enters F2 from step 1).
  - **Outcome:** A clear answer is resolved and the skill flow continues.
  - **Covered by:** R10, R11

---

## Requirements

**Transcript discovery and connection**
- R1. When Live Transcript Mode is first activated in a session, Claude must search for Notion pages matching today's date and a transcript naming pattern via the Notion MCP.
- R2. If multiple transcript candidates are found, Claude presents them for operator selection. If exactly one is found, Claude auto-selects it with confirmation. If none are found, Claude reports the failure and falls back to normal input.
- R3. Once a transcript page is identified, its page ID is cached for the session. Subsequent activations of Live Transcript Mode skip discovery.

**Marker management**
- R4. Markers are collapsed toggle blocks containing a structured label: `LT:{QUESTION_ID}:START` and `LT:{QUESTION_ID}:STOP`, where LT identifies this as a Live Transcript marker and QUESTION_ID is a sequential identifier within the session. Toggle blocks are collapsed by default and effectively invisible in the transcript unless expanded. (HTML comments are not supported by Notion's block-based content model.)
- R5. Claude writes the START marker into the transcript page via Notion MCP immediately when the operator activates Live Transcript Mode for a question.
- R6. Claude writes the STOP marker when the operator signals completion.

**Operator feedback**
- R7. The operator signals "discussion complete" by typing anything into the Claude session (any text, including just hitting enter).
- R8. Claude must display a visible "Listening..." indicator while waiting for the operator's completion signal. No silence timeout is implemented.
- R18. When a transcript is connected, Claude displays a persistent "Live Transcript Mode active" status indicator (ideally in the status line, like Remote Control mode). If the status line API is not available to plugins, Claude prints a confirmation message after connection and on each invocation as a fallback.

**Synthesis and answer injection**
- R9. After reading the tagged transcript section, Claude synthesizes the discussion into an answer appropriate to the question type — a menu selection, a text response, or a set of decisions — and presents it to the operator to relay back to the calling skill or conversation.
- R10. When the transcript content is ambiguous (disagreement, off-topic discussion, unclear consensus), Claude summarizes the identified perspectives, presents them as selectable options, and includes a "Re-discuss" option.
- R11. If the operator selects "Re-discuss," Claude writes a new START marker and re-enters the discussion capture flow.

**Invocation and integration**
- R12. Live Transcript Mode is a standalone skill invoked explicitly by the operator (`/bcal-workflow:live-transcript`). It does not inject itself into other skills' menus or modify any third-party plugin.
- R13. The skill is not coupled to any specific workflow — it works alongside compound-engineering, proposal-pro, freeform Claude conversations, or any future skill that presents questions.
- R14. The mode requires the Notion MCP server to be available. If it is not detected, the skill reports this and exits gracefully.

**Architecture**
- R15. All logic — transcript discovery, connection, marker management, reading, synthesis, and answer presentation — lives entirely within the `live-transcript` skill in bcal-workflow. No third-party plugins are forked or modified.
- R16. The skill operates as a mediator: the operator invokes it when a question arises, it manages the transcript interaction, synthesizes the answer, and returns the result to the operator who relays it to whatever prompted the question.
- R17. The skill is agent-agnostic. It uses platform-specific question tools (`AskUserQuestion` for Claude Code, `request_user_input` for Codex, `ask_user` for Gemini) following the bcal-workflow plugin convention. The Notion MCP dependency uses the open MCP standard, not a Claude-specific API.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given it's 2:00 PM and two Notion transcripts exist for today ("@Today 10:15 am" and "@Today 1:45 pm"), when the operator invokes `/bcal-workflow:live-transcript` for the first time, Claude presents both transcripts and the operator picks "@Today 1:45 pm." On the next invocation, no discovery prompt appears — Claude uses the cached page.

- AE2. **Covers R5, R6, R7, R9.** Given a brainstorm skill asks "Which of these 3 ideas resonates?", the operator invokes `/bcal-workflow:live-transcript`. Claude writes a collapsed toggle block containing `LT:Q5:START` into the transcript. The team discusses for 2 minutes. The operator types "done" in Claude. Claude writes `LT:Q5:STOP`, reads the section, determines the team converged on Idea B, and presents "The team converged on Idea B" for the operator to relay.

- AE3. **Covers R10, R11.** Given the team's discussion includes Alice advocating for Idea A and Bob advocating for Idea C with no resolution, Claude responds: "I heard two perspectives: (1) Idea A — Alice argued it's simpler. (2) Idea C — Bob argued it scales better. (3) Re-discuss." The operator picks option 1, and Claude presents Idea A as the synthesized answer.

- AE4. **Covers R14.** Given the Notion MCP server is not configured, when the operator invokes `/bcal-workflow:live-transcript`, Claude reports that a Notion MCP connection is required and exits.

---

## Success Criteria

- The operator never has to synthesize group discussion into typed text during a call — Claude does it.
- The conversation flow on the call feels continuous; the skill's questions enhance the discussion rather than interrupting it.
- A downstream planner or implementer can tell from the requirements doc alone how to build this without inventing behavior.

---

## Scope Boundaries

- No silence-based timeout for ending discussion capture — always operator-triggered.
- No multi-operator support — single operator per session.
- No audio processing — relies entirely on the text transcript in Notion.
- No transcript providers other than Notion in v1.
- No automatic cleanup or removal of markers from the transcript after the session.
- No persistent memory of transcript connections across sessions.
- No modification to any third-party skill or plugin. This skill is entirely self-contained in bcal-workflow.
- Not limited to compound-engineering — works with any workflow that presents questions.

---

## Key Decisions

- **Self-contained in bcal-workflow:** All logic lives in a single `live-transcript` skill. No third-party plugins are forked or modified. The skill acts as a mediator — the operator invokes it explicitly, it manages the transcript interaction, and returns a synthesized answer the operator provides to whatever skill or conversation prompted the question.
- **Explicit invocation, no menu injection:** The skill is invoked by the operator (`/bcal-workflow:live-transcript`), not injected as a `T` option into other skills' menus. This keeps it fully decoupled — any installed bcal-workflow user has access, no other plugins are aware of it, and there's nothing to suppress when working solo.
- **Agent-agnostic:** Uses platform-specific question tools and the open MCP standard. No Claude-specific APIs. Does not conflict with speech-to-text capabilities in Claude Desktop or other agents — those transcribe into the chat input, while this reads from a Notion page.
- **"Live Transcript Mode" naming:** Descriptive and precise. Makes it clear this reads a text transcript, not audio.
- **Labeled markers with question IDs:** Enables multiple tagged sections to coexist without cleanup. Each section is self-identifying.
- **Ambiguity handling:** Summarize tensions + present options + offer re-discuss. Rationale: respects the group's discussion while giving the operator a quick resolution path.

---

## Dependencies / Assumptions

- A Notion MCP server is available and can: search pages by title, append toggle blocks to a page, and read page content.
- The meeting bot writes the transcript to Notion in near real-time (seconds, not minutes).
- Transcripts follow a discoverable naming pattern containing today's date and a timestamp.
- The Notion MCP can write toggle blocks to a page. Toggle blocks serve as markers because they are collapsed by default and effectively invisible in the transcript.

---

## Outstanding Questions

### Resolved

- [R4] HTML comments are not supported by Notion's block-based model. Markers will use collapsed toggle blocks instead — effectively invisible in the transcript. Resolved 2026-05-01.
- [R1] Notion's search API supports partial title match. Searching for the date portion of the transcript name returns all matching pages, sorted by last edited time. The exact date format in transcript titles needs to be confirmed during planning. Resolved 2026-05-01.

### Deferred to Planning

- [Affects R5, R6][Technical] Where in the Notion page should markers be appended — end of page, inline near the latest content, or as a specific block type?
- [Affects R8][Technical] What does the "Listening..." indicator look like in Claude Code's UI? Is there a status mechanism, or is it just a printed message?
- [Affects R16][Technical] What's the best UX for the operator to relay the synthesized answer back to the calling skill — copy-paste, direct typing, or can the skill pre-fill it?
- [Affects R18][Needs research] Can plugins/skills control the Claude Code status line (lower-right indicator), or is it reserved for built-in features like Remote Control? If not available, the printed-message fallback applies.

---

## Next Steps

-> `/ce-plan` for structured implementation planning. All blocking questions are resolved.
