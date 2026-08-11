AI Tools for Development
Which AI tools did I try?

I used Claude AI as my main AI assistant for this task. It helped me with generating code snippets, debugging, and explaining new concepts.

What worked well?
Debugging: I gave Claude a piece of buggy NestJS code (a findOne method using = instead of === inside .find()). Claude quickly spotted the bug, explained why it happened (assignment vs comparison, and how the assignment's return value is truthy), and pointed out a subtle side effect — the code was also silently mutating the array data. This kind of bug is easy for a human to miss because it doesn't throw an error, so having AI catch it quickly was genuinely useful.
Concept explanation: Since I'm not very familiar with Node.js/NestJS yet, I asked Claude to explain Dependency Injection. It used a simple real-world analogy (a coffee shop and a coffee machine) instead of jumping straight into framework jargon, which made the concept much easier to understand as a beginner.
Overall, Claude was good at breaking down explanations step by step when I said I didn't understand something, instead of just repeating the same explanation.
What didn't work well?
When my instructions were a bit tricky, vague, or not clearly phrased, Claude sometimes had difficulty understanding exactly what I meant, and I had to rephrase or clarify before getting a useful answer.
For a beginner, some explanations can still be too fast/dense unless I explicitly ask to slow down or simplify.
When is AI most useful for coding?
Debugging subtle syntax errors that don't crash the program but silently produce wrong results (e.g. = vs ===) — these are hard to catch by eye but easy for AI to flag.
Learning new concepts as a beginner, especially when the AI can use analogies instead of just technical definitions.
Less useful when instructions are ambiguous — clear, specific prompts get much better results than vague ones.