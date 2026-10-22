# ProfileFinder UI/UX Guidelines

This document defines the visual and interaction standards for ProfileFinder. Apply it to all new screens and use it
to guide incremental improvements to existing screens.

## Product principles

- Make privacy, consent, and result limitations clear without overwhelming the user.
- Use calm, practical visual language suitable for a privacy-focused utility.
- Prefer clear feedback and predictable navigation over decorative elements.
- Keep the interface usable on small screens and with keyboard navigation.

## Color and visual language

- Use neutral slate surfaces, clear borders, and restrained violet as the primary interactive accent.
- Do not introduce decorative gradients unless they communicate a concrete state or hierarchy.
- Do not use sparkles, emojis, or ornamental icons in page titles or hero copy.
- Avoid glow effects. Interactive feedback should use a subtle border, background, or shadow change.
- Reserve semantic colors for their meaning:
  - Green: completed, verified, or configured.
  - Amber: attention needed, uncertain, or demonstration data.
  - Red: validation errors, unavailable services, destructive actions, or failed jobs.
  - Violet: primary actions, active navigation, and selected controls.

## Typography

Use the existing system sans-serif stack. Do not introduce display fonts without an accessibility and loading review.

| Element | Size | Weight | Line height |
| --- | --- | --- | --- |
| Page title | 30px desktop / 24px mobile | 700 | 1.2 |
| Section title | 20px | 700 | 1.3 |
| Card title | 16px | 600 | 1.4 |
| Body text | 16px | 400 | 1.5 |
| Supporting text | 14px | 400 | 1.45 |
| Metadata and labels | 12px | 500 | 1.4 |

- Keep body text at normal weight. Do not pair oversized headings with thin or undersized paragraphs.
- Use a consistent 8px spacing rhythm between heading, supporting copy, and controls.
- Write concise labels that describe the action or state directly.

## Layout

- Use the shared application shell for header, main content, and footer on every route.
- Keep page content inside the established maximum content width.
- Use 16px horizontal page padding on small screens and 24px or more on larger screens.
- Use one-column layouts by default. Introduce two or three columns only when each column has a distinct purpose.
- Preserve a predictable page sequence: page header, primary task or status, supporting controls, secondary information.
- Keep related controls close together and separate unrelated sections with consistent vertical spacing.

## Component system

Use no more than three border-radius sizes:

| Token | Radius | Intended use |
| --- | --- | --- |
| Small | 8px | Inputs, compact controls, badges |
| Medium | 12px | Buttons, selector cards, notices |
| Large | 16px | Primary content cards and empty states |

- Reuse the shared `Button`, `Card`, `Badge`, `PageHeader`, and `EmptyState` components before creating new variants.
- Keep card padding, title placement, and action placement consistent across a page.
- Size icons proportionally: 16px beside button text, 20px for section headings, and 24px only for prominent status cards.
- Do not add social icons unless they trigger a real, supported action.
- Give icon-only buttons an accessible label and a visible focus state.

## Interactive states

Every interactive control must have visible default, hover, active, focus, disabled, and error states where relevant.

- Hover feedback should be subtle: a small background/border change or a maximum 2px lift.
- Focus states must be keyboard-visible and meet contrast requirements.
- Disabled controls must explain why they are unavailable when the reason is not obvious.
- Destructive actions must require an explicit confirmation step.
- Do not present a control that does nothing or points to an unavailable feature without clearly labelling it as unavailable.

## Motion and animations

- Animate only feedback that helps users understand a transition, processing state, or changed hierarchy.
- Use `cubic-bezier(0.2, 0, 0, 1)` for short interface transitions.
- Keep routine transitions between 150ms and 200ms.
- Use staggered entrance animation only for a group of newly loaded independent items; use 40ms to 80ms between items.
- Do not animate large layout shifts, content that the user needs to read immediately, or essential error messages.
- Respect `prefers-reduced-motion` for non-essential motion.

## Loading, empty, and error states

- Every asynchronous action needs an immediate loading state.
- Buttons that initiate a request should show an in-button spinner and remain disabled until the request resolves or is cancelled.
- Show job progress with a specific provider/platform status instead of a generic spinner where possible.
- Use skeleton screens for data-dense cards or lists when content shape is known.
- Use empty states to explain the next useful action, not merely that a list is empty.
- Show actionable error messages near the affected control. State what failed and the corrective action.
- Never display a successful-looking state after a request has failed.

## Forms and validation

- Validate input on submission and provide focused, field-level feedback.
- Preserve valid user input after a validation or network error.
- Mark required fields only when they are genuinely required for the selected path.
- Describe provider requirements before submission, especially for image URLs, consent, and API-dependent features.
- Avoid generic "Invalid request" messages in the user interface. Translate backend failures into meaningful instructions.

## Copywriting

- Prefer direct, specific language: "Start profile search" instead of "Continue".
- State limitations precisely: "Suggestions are unverified" instead of "Results may vary".
- Avoid vague marketing phrases such as "Launch faster", "Build your future", or "Powerful insights".
- Do not overuse em dashes. Prefer full sentences, commas, or short parenthetical phrases.
- Use sentence case for buttons, labels, headings, and status messages.
- Write privacy information in plain language and place it where the related decision is made.

## Accessibility and responsive behavior

- Meet WCAG AA contrast for text, controls, focus indicators, and status colors.
- Support keyboard navigation for every workflow.
- Do not use color as the sole indicator of status; pair it with text and an icon where needed.
- Keep touch targets at least 44px by 44px where practical.
- Test at narrow mobile widths, standard laptop width, and large desktop width.
- Avoid horizontal scrolling except for intentionally scrollable, labelled data regions.

## Review checklist

Before merging a UI change, confirm:

- The screen uses the shared layout and existing components where appropriate.
- Type scale, spacing, radii, icons, and semantic colors follow this guide.
- All buttons and toggles have a working outcome.
- Async requests have loading, success, empty, and error states.
- Errors are specific and preserve user input.
- The flow is usable with keyboard navigation and on a small screen.
- Copy is factual, concise, and clear about privacy limitations.
