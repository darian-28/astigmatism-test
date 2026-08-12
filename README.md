# Eye Clarity Test

Build a simple, functional web application called “Test for Astigmatism” for a school physics exhibition about the human eye and defects of vision.

The application is an educational visual screening demonstration, NOT a medical diagnostic device.

The goal is to demonstrate how differences in visual clarity between different line orientations can be associated with astigmatism, while clearly telling the user that only a qualified eye-care professional can diagnose astigmatism.

1. Core principles

Priorities, in this order:

Functional correctness

Simple and scientifically responsible testing flow

Extremely simple UI

Reliable interaction on a laptop

Clear results

No unnecessary animations, accounts, dashboards, databases, or decorative features

Do NOT make the website flashy.

Do NOT add unnecessary gradients, animations, illustrations, cards, authentication, user accounts, payment systems, social features, or complex backend functionality.

This is a small exhibition prototype.

Use the simplest reliable technology stack available in Lovable, preferably a straightforward React + TypeScript frontend.

No database is required.

No user account is required.

No personal information should be collected.

No test results should be permanently stored.

The application should work as a normal web application in a modern desktop browser.

2. Important scientific limitation

The application must NOT claim that it can medically diagnose astigmatism.

The app should describe itself as:

“An educational visual screening demonstration.”

The result must use wording such as:

“Possible indication of astigmatism — consider getting your vision checked by an eye-care professional.”

It must never say:

“You definitely have astigmatism.”

Likewise, a negative result must NOT say that the person definitely does not have astigmatism.

Instead use:

“No indication detected in this screening.”

followed by:

“This does not rule out astigmatism or other vision problems.”

Include this disclaimer clearly:

“This is an educational screening demonstration, not a medical diagnostic test. Only an eye-care professional can diagnose astigmatism.”

3. Scientific basis of the test

Do NOT use a red/green duochrome test as the primary astigmatism test.

Instead, create a simplified radiating-line / fan-chart visual test.

The reason is that astigmatism can cause different optical meridians of the eye to focus differently, which can make differently oriented lines appear to have different clarity or darkness.

This is an educational simplification of concepts used in clinical subjective refraction.

Do not claim that this web test has clinical diagnostic accuracy.

Do not invent medical sensitivity or specificity numbers.

Do not claim that the scoring algorithm is clinically validated.

4. Overall user flow

The application should have these screens:

Welcome

Instructions

Vision correction question

Test setup

Eye test

Results

Restart

Keep everything on one simple page at a time.

Use a very clean white/light background, dark text, simple typography, and one clear accent color.

5. Welcome screen

Display:

Test for Astigmatism

Subtitle:

An interactive demonstration of how the human eye focuses light in different directions.

Short explanation:

“Look carefully at the line patterns and tell us which direction appears darkest or sharpest.”

Large button:

START TEST

Below the button, display a small notice:

Educational screening only — not a medical diagnosis.

No unnecessary graphics.

6. Instructions screen

Title:

Before you start

Display these instructions:

Sit comfortably in front of the laptop.

Keep your face approximately 40–60 cm from the screen.

Keep the screen brightness at a normal, comfortable level.

Avoid strong glare or direct light reflected on the screen.

Keep your head reasonably straight.

If you normally use glasses for seeing the screen clearly, keep them on.

Answer based on what you actually see. There are no “correct” answers.

Do not squint.

Add:

“The test takes about 2–3 minutes.”

Then:

CONTINUE

Do not require an exact distance because the exhibition setup may have limited space.

7. Vision correction question

Ask:

Do you normally use vision correction?

Three large buttons:

Glasses

Contact lenses

Neither

Also allow:

Prefer not to say

This information should NOT be stored permanently.

After selection, continue automatically or show:

CONTINUE

Important:

Do not tell users to remove or put on corrective lenses in a way that could compromise their normal vision. The goal is simply to record whether they normally use correction and allow them to test under their usual comfortable viewing condition.

8. Test setup

Before the first test screen, show:

Get ready

Display:

You will see a pattern of lines pointing in different directions.

For each question, choose the group of lines that looks darkest or sharpest to you.

Then:

Look at the centre of the pattern.

Do not move closer to the screen to inspect it.

Button:

BEGIN TEST

9. Test design

Create approximately 8 test questions.

The number should be easy to change in a single configuration variable.

Each test should display a central fixation point and a circular/radial fan chart.

The chart should contain multiple groups of straight lines extending from the centre.

Use approximately 12 line orientations distributed around 180 degrees.

For example:

0°, 15°, 30°, 45°, 60°, 75°, 90°, 105°, 120°, 135°, 150°, 165°.

The visual should be clean and symmetrical.

Use dark lines on a light background.

Do NOT use decorative colors.

Do NOT make the chart visually confusing.

The line thickness, spacing, contrast, and chart size should remain controlled by the application.

10. Question format

Each question should ask:

Which lines look darkest or sharpest?

Show three answer choices:

A

B

C

Each answer corresponds to one selected orientation/group of the fan chart.

The user should NOT be told which orientation each option represents.

The application records the selected orientation internally.

The choices should be randomized so the correct/expected orientation is not always A, B, or C.

Do not label an answer as “correct” during the test.

11. Test variations

Do not simply display the exact same chart eight times.

Create controlled variations.

Each question should slightly vary the orientation grouping or presentation while preserving the underlying visual test.

The purpose is to check whether the visitor gives a consistent directional response rather than simply selecting the same option repeatedly.

Use approximately 8 trials.

At least some trials should repeat or cross-check similar orientations.

The final algorithm should therefore consider consistency across trials.

12. Scoring algorithm

Implement a simple deterministic screening algorithm in the frontend.

Do NOT use machine learning.

Do NOT use an external AI API.

Do NOT pretend that machine learning is required.

The algorithm should:

Record the orientation associated with every selected answer.

Normalize all orientations to a 0–180° range because line orientation is symmetrical across 180°.

Group similar orientations together.

Identify whether the user's selections show a consistent preferred orientation.

Measure the consistency of that preference.

If responses are inconsistent or approximately evenly distributed, classify the result as having no clear indication.

If responses show a sufficiently strong and repeatable directional preference, classify the result as a possible indication.

Use a transparent threshold that is configurable in code.

For example, initially use:

8 total trials

A preferred orientation must appear in at least 5 of 8 trials or an equivalent normalized cluster.

The preferred orientation should also appear consistently in the cross-check trials.

However, make these values constants at the top of the scoring code so they can easily be changed after exhibition testing.

IMPORTANT:

This threshold is an exhibition screening rule, NOT a medically validated diagnostic threshold.

Add a code comment explicitly stating this.

13. Reliability check

The app should also calculate whether the answers are internally consistent.

If the user gives highly inconsistent answers, do not force a positive or negative conclusion.

Instead show:

Result inconclusive

Text:

“Your responses did not show a clear directional pattern in this screening.”

Then:

“This demonstration cannot determine whether you have astigmatism. If you have blurry, distorted, or uncomfortable vision, consider having your eyes examined by an eye-care professional.”

This is preferable to incorrectly classifying the visitor.

14. Positive screening result

If the directional pattern meets the configurable exhibition threshold, display:

Possible indication of astigmatism

Then:

“Your responses showed a consistent difference in how you perceived lines at different orientations.”

Then:

“This can be associated with astigmatism, but this screening cannot diagnose it.”

Then:

What should you do?

Consider getting a comprehensive eye examination.

Tell the eye-care professional about any blurred or distorted vision you experience.

If you already wear glasses or contact lenses, bring your current prescription information if available.

Do not change your glasses or contact lenses based on this test alone.

Then prominently display:

“Only an eye-care professional can diagnose astigmatism.”

15. Negative screening result

If there is no sufficiently consistent directional pattern, display:

No indication detected

Text:

“This screening did not find a clear directional pattern in your responses.”

Then:

“This does not prove that your vision is free from astigmatism or other eye problems.”

Then:

“If you experience blurred, distorted, uncomfortable, or otherwise unusual vision, consider getting your eyes checked by an eye-care professional.”

Do NOT say:

“You are definitely fine.”

Do NOT say:

“You do not have astigmatism.”

16. Inconclusive result

If the reliability check determines that the responses are too inconsistent, display:

Screening inconclusive

Text:

“Your answers did not produce a clear enough pattern for this demonstration.”

Then:

“This result is not a diagnosis. If you have concerns about your vision, consider a professional eye examination.”

Give two buttons:

TRY AGAIN

FINISH

17. Results score

On the results screen, show a simple non-medical score explanation.

For example:

Response consistency: 6/8

or

Directional pattern: Consistent

Do not call this a “medical score.”

Do not display a fake probability such as:

“73% chance of astigmatism.”

Do not estimate the severity of astigmatism.

Do not estimate prescription power.

Do not estimate cylinder strength.

Do not estimate axis.

The application is only screening for a possible directional visual pattern.

18. Restart

At the bottom of the results screen provide:

TEST AGAIN

This should completely reset the temporary session data and start from the beginning.

Also provide:

DONE

The Done button can return to the welcome screen.

No results should be saved after the session ends.

19. Privacy

The application must not request:

Name

Email

Phone number

Date of birth

Address

Account

Password

Do not create authentication.

Do not create a database.

Do not store individual test results.

All answers should exist only in the current browser session/state.

When the test is restarted, clear the previous answers.

20. Exhibition statistics

Because this is an exhibition, optionally maintain a very simple anonymous session counter using local browser storage only.

Display a small statistic on the welcome/results page such as:

Visitors tested on this laptop: 24

If implementing this feature would complicate the application significantly, omit it.

Do not store individual answers.

Do not upload personal data.

If a counter is implemented, make it easy to reset by clearing local storage.

21. Accessibility

Use:

Large readable text

Large clickable buttons

Strong contrast

Keyboard-accessible controls

Clear focus states

No color-only instructions

No tiny controls

The test itself depends on visual perception, so do not add visual clutter around the test chart.

22. Responsive behavior

The primary target is a laptop.

Still make the application reasonably responsive so that the layout does not break on smaller screens.

The test chart should scale proportionally.

Do not let the chart become stretched horizontally or vertically.

Keep the circular fan chart circular.

23. Fullscreen/kiosk mode

Add a simple:

FULLSCREEN

button where technically practical.

Use the browser Fullscreen API.

If fullscreen is unavailable or denied, the app must continue working normally.

Do not require fullscreen for the test.

24. Error handling

The app must never get stuck if:

A user does not select an answer

The browser window is resized

Fullscreen is denied

The user presses the browser back button

The page is refreshed

If the user attempts to continue without selecting an answer, show:

“Please select an answer to continue.”

Do not silently record an answer.

25. Visual design

Use an extremely minimal design.

Preferred:

White or very light background

Black/dark text

One restrained accent color

Simple sans-serif font

Large headings

Large buttons

Plenty of whitespace

Thin borders where useful

Avoid:

Gradients

Glassmorphism

3D effects

Decorative illustrations

Excessive shadows

Animated backgrounds

Complex navigation

Stock images

Unnecessary icons

The fan chart itself is the main visual element.

26. Technical implementation

Use the simplest maintainable frontend architecture.

Prefer:

React

TypeScript

CSS/Tailwind if already supported by the project

No backend unless absolutely necessary

Keep the test data and scoring configuration in a dedicated configuration section.

For example, conceptually:

NUMBER_OF_TRIALS = 8

POSITIVE_THRESHOLD = configurable

CONSISTENCY_THRESHOLD = configurable

Do not hard-code values throughout multiple components.

Keep the scoring function separate from the UI components.

Create clear functions for:

generating a test

recording an answer

normalizing orientation

calculating consistency

calculating the screening result

resetting the session

27. Important visual-test implementation detail

Do not rely on random line thickness or random brightness to determine the user's answer.

The visual stimulus must be controlled.

The application should use mathematically defined orientations and consistent rendering.

Use Canvas or SVG if that provides more precise control over the fan-chart lines.

The chart must remain centered and symmetrical.

The three answer choices should correspond to different line-orientation groups.

The user should be comparing what they visually perceive, not guessing based on labels.

28. Test reliability

Add an internal reliability calculation.

The result should depend on the pattern across multiple trials rather than a single answer.

Do not classify someone as having a possible indication based on one question.

Do not classify someone as having no astigmatism based on one question.

If the data is insufficient or inconsistent, return “inconclusive.”

29. Medical wording

Use the following wording consistently:

Header:

Educational screening demonstration

Footer/disclaimer:

This is not a medical diagnostic test. Only an eye-care professional can diagnose astigmatism.

Positive:

Possible indication of astigmatism

Negative:

No indication detected

Inconclusive:

Screening inconclusive

Never use:

“Diagnosis”

“Confirmed astigmatism”

“You definitely have astigmatism”

“You definitely don't have astigmatism”

“Your astigmatism is X%”

“Your prescription is X”

“Your cylinder is X”

“Your axis is X°”

30. Final acceptance criteria

Before considering the app complete, verify all of the following:

[ ] Welcome screen works.

[ ] START TEST works.

[ ] Instructions appear before testing.

[ ] Glasses/contact-lenses/neither question works.

[ ] Eight test trials work.

[ ] Each trial renders a clear circular fan chart.

[ ] The fan chart remains circular when the browser is resized.

[ ] The user can select A, B, or C.

[ ] The selected answer is visually acknowledged.

[ ] The user cannot continue without selecting an answer.

[ ] The next trial works.

[ ] All answers are recorded correctly.

[ ] The scoring algorithm runs only after all trials are complete.

[ ] The scoring algorithm is deterministic.

[ ] The algorithm checks consistency rather than one answer.

[ ] Positive, negative, and inconclusive results are possible.

[ ] The result wording does not claim medical diagnosis.

[ ] TRY AGAIN resets the entire test.

[ ] No account is required.

[ ] No personal information is collected.

[ ] No individual results are stored in a database.

[ ] The app works on a laptop in a modern browser.

[ ] The interface is minimal.

[ ] There are no unnecessary animations.

[ ] Fullscreen works where supported.

[ ] The app has no console errors.

[ ] The app can be deployed as a normal public website.

31. Build instruction

Do not merely describe the application.

Actually implement the complete working application.

After implementation, run through the entire user flow yourself and fix any broken interactions.

Pay particular attention to:

Fan-chart rendering

Answer-to-orientation mapping

Randomization

Scoring

Resetting

Browser resizing

Fullscreen

Result screens

Do not add features that are not required above.

The final result should feel like a small, clean science-exhibition experiment rather than a commercial medical website.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://astigmatism-test.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5363e02e-f878-4741-943c-70a543e9e527).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
