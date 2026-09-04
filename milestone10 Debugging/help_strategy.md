# Help Strategy: Google vs. AI Tools vs. Colleagues

## Decision framework

See `help_strategy_flowchart.png` for the full flowchart. The short version:

1. When I get stuck, I try to look at the error / think for a few minutes
   myself first, instead of going straight to AI.
2. If it involves sensitive or internal information (company code, keys,
   business logic), I sanitize it before using AI — or if it can't be
   sanitized, I don't use a public AI tool at all and ask a colleague /
   check internal docs instead.
3. For a concrete problem I need to solve (a bug, an implementation
   detail), I go to AI.
4. For something where the big direction is unclear (architecture, design
   decisions), I ask a colleague — AI doesn't have the team/project
   context to make that call.
5. Before accepting an AI answer, I run it, test it, and check that I
   actually understand why it works. If I can't get it to work or don't
   understand it, that's when I go to a colleague instead of continuing to
   guess.

## When do I prefer using AI vs. searching Google?

Right now I mostly go to AI first rather than searching Google directly —
AI tools already aggregate a lot of what would otherwise be scattered
across Google results, so it's faster. When I do end up on Google, it's
usually because AI pointed me to a link, not because I searched there
first.

## How do I decide when to ask a colleague instead?

Two triggers push me to a colleague instead of AI:

- **The problem is about direction, not implementation** — architecture or
  design decisions where I'm not sure what the right approach even is. AI
  can give me an opinion, but it doesn't know our team's context or
  constraints, so a colleague's judgment matters more here.
- **The information is sensitive and can't be sanitized.** I'm still in an
  internship, but I've already learned that anything involving real
  company code, internal business logic, or credentials needs to either be
  sanitized before going near a public AI tool, or just not go there at
  all — in which case a colleague or internal docs is the right place to
  ask instead.

## What challenges do I face when troubleshooting alone (and with AI)?

Talking this through with ChatGPT (see notes below) helped me put a name
to something I already knew was a problem for me: **when I'm in a rush, I
sometimes copy an AI answer without actually understanding it.** That's
also how AI mistakes get past me — not because the code looks wrong, but
because it looks *plausible* and I didn't slow down to check it. I've also
run into AI giving me outdated API usage from an older library version,
which only showed up once I actually ran the code.

The honest tension I noticed while working through this task: I said
architecture/direction questions go to a colleague and implementation
questions go to AI — but I also admitted I go to AI for almost everything
now by default. That's the exact risk ChatGPT flagged in our conversation:
relying on AI for every small problem can quietly erode my own
debugging/problem-solving ability, because "I can write this code" starts
to actually mean "I know how to get AI to write this code." Adding the
"look at the error / think for a few minutes myself first" step to the
flowchart above is my attempt to actually correct for that, not just
acknowledge it.

## 30-minute AI conversation notes (perspectives on AI in coding)

Three takeaways from spending time with ChatGPT on when AI helps vs. when
it doesn't:

- **AI can be confidently wrong** — syntax can be perfectly valid while the
  logic, an edge case, an outdated API, or a security assumption is wrong.
  The only reliable way to catch this is to run it, test it (including
  edge cases like empty/null input), and actually read what it's doing
  rather than trusting that a good explanation means correct code.
- **Over-relying on AI has a real cost over time** — using it to skip
  every small debugging step instead of using it to *support* my own
  debugging (e.g. asking "what does this error mean, here's what I think
  is going on" instead of "fix this for me") trades short-term speed for
  long-term understanding.
- **Sensitive/company info needs to be sanitized before it goes into a
  public AI tool** — real code, credentials, customer data, and internal
  business logic should be replaced with placeholders (e.g. `Company A`,
  `<API_KEY>`) before asking, or the question should go to a colleague
  instead.

One-line summary: *Use AI to accelerate your work, not to replace your
understanding. Always verify the output, and never expose confidential
information.*