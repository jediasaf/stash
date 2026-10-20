# Stash usability test kit

Five sessions, 30 minutes each, with people close to the target user: Trust & Safety analysts, people moving from operations into data roles, and MITB or similar students. The goal is to find where people hesitate, not to prove the design works.

## What we want to learn

1. Can someone set a goal and find which skills they still need to prove, without help?
2. Do people understand the difference between "Self-reported", "Completed learning", "Passed skill check" and "Proof added"?
3. Does PDF to podcast feel worth the wait, and is it clear the file never leaves the phone?
4. Do live job listings feel relevant to the target role, or noisy?
5. Does anyone read "Evidence on file for 3 of 5" as a chance of being hired? (It is not, and we need to know if the wording fails.)

These are hypotheses. Write down what people do, not what we hoped.

## Before each session

- Open https://stash-mobile-flax.vercel.app/?dev=1#/settings on the participant's phone (or a test phone).
- Tap **Delete all data**, then turn on **Record this session**. The log stays on the phone.
- Have a short PDF ready on the phone: lecture notes, a policy document or a report, under 10 pages. If they have none, the sample document works.
- Ask permission to take notes and, if they agree, to record the screen. Nothing is shared outside the team.

## Script

**Intro (2 min).** "We are testing the app, not you. Think out loud. If you get stuck, that is useful for us. You can stop at any time."

**Task 1: Set up (5 min).** "Create an account and set it up for a role you would like next."
- Watch: do they choose "A target role" or "Just curious"? Do they use the résumé upload? Do they understand the experience levels?

**Task 2: Find a gap (5 min).** "Find one skill your target role needs that you have not proved yet. Then do something about it."
- Watch: do they find Growth, then Proof of Skill? Do they take a skill check, add proof, or open a course?
- Ask after: "What does 'Passed skill check' tell an employer? What does 'Proof added' tell them?"

**Task 3: Listen to a document (8 min).** "Turn your PDF into a two-person podcast and listen to the first minute."
- Watch: do they read "What happens to your file"? How do they react to the voice download and the wait? Do they leave the screen while it renders?
- Ask after: "Would you use this on your commute? What would stop you?"

**Task 4: Look for a role (5 min).** "Find a job you might apply for and decide whether you are ready."
- Watch: do they trust the live listings? Do they open the original listing? How do they read the comparison?
- Ask: "If a friend saw '3 of 5' on this screen, what would they think it means?"

**Wrap-up (5 min).**
- "What was the most useful part? The most confusing?"
- "If Stash disappeared tomorrow, what would you miss?"
- "On a scale of 1 to 7, how easy was it to do what you wanted?" (Single Ease Question; record per task if time allows.)

## After each session

- In Preferences (with `?dev=1`), tap **Download** next to Session log and rename the file `session-P1.json` (P2, P3...). Then **Clear**.
- Fill in one row of the table below within the hour.

| # | Who (role, no names) | Task 1 | Task 2 | Task 3 | Task 4 | Biggest hesitation | Quote worth keeping |
|---|---|---|---|---|---|---|---|
| P1 | | done / help / gave up | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| P4 | | | | | | | |
| P5 | | | | | | | |

## Reading the results

- A problem seen by **two or more** of five people is worth fixing first.
- Separate **comprehension** problems (they misread a label) from **findability** problems (they could not find the screen) and **trust** problems (they did not believe it).
- The session log shows each screen and tap with a timestamp. Long gaps between taps usually mark the hesitation worth asking about.
