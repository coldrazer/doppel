# Wren acceptance journeys

Run both journeys against the final running build and retain Wren's actual results for hackathon submission. These are test instructions, not fabricated Wren output.

## 1. Create and publish a lesson

Start at `/`. Create a fresh walkthrough and confirm replacing the local draft. Upload `public/demo/step-1.png`, `step-2.png`, and `step-3.png` in order. Name it “Expense onboarding” and enter the goal “Learn to submit an expense”. Generate with AI; verify one editable instruction and a bounded target per screen. Correct targets if needed, change one title, and move a step down and back up. Reload and verify edits persist. Publish, open the learner link in a fresh tab, and verify all three steps appear. Editing the creator draft must not mutate the published version.

Pass criteria: all screenshots load; edits persist; publishing works; independent learner view matches the published snapshot; no console errors.

## 2. Complete a practice run

Open the published learner URL. Click outside the target: verify hint text appears and the correct area is highlighted without advancing. Click the correct target on each screen. Verify progress updates and completion after the third action. Restart and verify it returns to step one. Repeat at a mobile viewport. Download Export HTML from the editor and complete its lesson with network access disabled.

Pass criteria: wrong clicks coach, correct clicks advance, completion and restart work, no horizontal overflow on mobile, exported lesson works offline.
