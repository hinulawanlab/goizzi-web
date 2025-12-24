##Rules

Adapt
-Read and understand and make sure that responses are based on the project’s mds and expectations defined in @goizzi_firestore_schema.md, goizzi_implementation_approach_srp_rules.md, goizzi_objectives.md and goizzi_ui_feedback_contract.md.
-Maintain consistency with MVVM architecture, naming rules, and code quality patterns already used across the codebase.

Planning Analysis
-Perform a project-level analysis before coding.
-Identify the objective, evaluate existing patterns, and explore safe alternatives.
-Ask clarifying questions when needed to ensure shared understanding and to create a traceable planning artifact for the project.
#In short, before coding, restate the objective, inspect current patterns, evaluate alternatives, and ask clarifying questions when needed.

Planning Task Breakdown
-Translate the analysis into a structured sequence of steps.
-Define exactly how the objective will be achieved, ensuring the plan focuses on immediate goals while staying aligned with long-term architecture.
#In short, convert the analysis into a clear, ordered list of steps. This defines the exact execution path.

Do
-Implement according to the plan using an iterative, self-review-driven loop.
-Surface reasoning and validation during the process. Make reasoning visible.
-Ask for the user’s input if additional insights are needed.
-Never modify UI unless explicitly requested, as UI is already approved by the UI/UX lead.

Coding
-Adopt the most practical, maintainable, and principled solution.
-Apply MVVM, SRP, and DRY at all times.
-Keep every file small, clear, and single-purpose.
-When encountering an SRP violation in existing code:
*Do not refactor everything at once.
*Propose a safe, minimal-risk extraction plan first (one helper at a time, one normalization at a time, one service at a time).
*Refactor incrementally alongside feature work, improving structure progressively with zero behavioral changes.
*Ensure every refactor maintains compatibility and avoids regressions.
-Do cache data properly (consider caching to avoid constant access to firebase but always be mindful of the freshness of data especially that lawyers need their record updated)
-Always handle edge cases, ordinary cases, and fallback paths consistently.

Tests
-Write and run tests, covering happy paths, edge cases, and failure modes.
-Ensure lint cleanliness and maintain at least 95% production-level confidence.
-run the following npx tsc, npm test, npm run lint and make sure it passed

Check
-Validate the implementation, internal documentation, and update relevant .md files.
-Confirm that the work aligns fully with the planned objectives and the architectural principles.

Act
-After each development session, perform a short retrospective to refine workflow alignment with developer-profile.md.
-If new patterns or preferences emerge from the user, append or update them in the developer profile to keep the project guidelines accurate and current.

Explain
-Provide a simple summary of what was done using clear, 10th-grade-level explanation and highlight key points.