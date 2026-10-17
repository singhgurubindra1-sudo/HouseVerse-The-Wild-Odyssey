# 🌳 Wildlands: a living house ecosystem

**Saranda House Build-a-Thon '26 · Theme 04: House Odyssey**

> Wildlands turns every house into a living national park that grows as its members take part, so newcomers feel welcomed, contributions are seen, and organisers get a simple dashboard to run it all.

Every house is named after a real Indian forest or national park, so instead of a points table each house gets its own **living forest** on screen. Every approved quest plants a tree, grows a bush or brings back an animal, and every item has a name tag showing who planted it and for which quest. If a house goes quiet for a week, its forest gently wilts, which nudges people to take part.

## What's inside

| Building block | What it is | Page |
| --- | --- | --- |
| **Ranger Onboarding** | Swipeable story cards: welcome, mascot, values, leaders, then a 5-question trivia quiz. Finishing it plants your **first seed** and gives the 🎖️ Ranger badge. | `/onboarding` |
| **Questboard** | Tech / Sports / Culture quests with Seeds rewards, deadlines and completion counts. Submit a photo, link or note as proof. | `/quests`, `/quests/[id]` |
| **House Forest** | The SVG map that grows from real data. Tap any tree to see who planted it. Progress bar to the next stage, wilting after 7 quiet days, legendary animal at 1,500 Seeds. Refreshes live. | `/house/[slug]` |
| **Habitat Card** | Profile with rank title, badges, a three-colour Tech/Sports/Culture chart, a mini map of your trees, and a share link (LinkedIn too). | `/u/[handle]` |
| **All Houses** | All nine forests ranked by how alive they are this season. | `/wildlands` |
| **Admin Control Room** | Overview (active members, pending approvals, Seeds per house, members going quiet), approval queue with bulk approve, quest editor, badges, house lore and trivia editor, members (bonus Seeds, roles), activity log. | `/admin/*` |

### Game rules
- **Seeds**: each quest is worth Seeds set by the admin. On approval they go to both the member and the house. Admins can give bonus Seeds.
- **Forest stages**: 🌰 Bare Land (0) → 🌱 Sapling (100) → 🌿 Grove (300, water appears) → 🌳 Forest (700, birds and small animals) → 🐘 Wildlands (1,500, the legendary animal returns).
- **Ranks**: Seedling (0) → Scout (50) → Tracker (150) → Ranger (300) → Warden (600) → Guardian of the Wild (1,000).
- **Badges**: Ranger, First Sprout, Code Tracker, Field Runner, Storyteller, All-Rounder, Streak Keeper (4 weeks in a row), Guide and Legend (awarded by hand). Super admins can create new rule-based badges.
- **Roles**: Member · House admin (their own house only) · Super admin (all houses).

### The nine houses
Saranda (elephant herd), Gir (Asiatic lions), Kanha (barasingha), Bandipur (tiger and elephant), Corbett (Bengal tiger), Namdapha (red panda), Pichavaram (water birds, mangroves and a boat), Wayanad (Asian elephants and a waterfall), Kaziranga (one-horned rhinos). Each forest has its own trees, water, colours and animals. **House colours are placeholders**: change them to the real logo colours in *Admin → House lore* (or in `lib/houses.ts` before seeding).

## Tech and architecture

- **Next.js 15 App Router** + TypeScript. Pages load their data in **server components**; every button that changes data is a **server action** (`app/actions/*`).
- **Tailwind CSS 4** for styling, with a **liquid glass** design system in `app/globals.css`: frosted, translucent panels over a drifting aurora backdrop. Mobile-first, with a floating glass dock on phones.
- **3D interface** with plain CSS 3D transforms, no 3D library: a rotating ring of all nine forests on the landing page (`components/forest/ForestRing.tsx`), each house forest shown as a tilting diorama with parallax layers, and cards that lean toward the pointer (`components/TiltEffects.tsx`). Tilt is off on touch screens, and all motion stops when the device asks for reduced motion.
- **Supabase**: Postgres database, login (email/password and Google), file storage for proof photos.
- **Row Level Security** in the database: members can only change their own name/photo and submit their own proofs; Seeds, roles and approvals can only change through database functions that check who you are. House admins can only manage their own house.
- **Approve is one transaction**: `review_submissions()` in `supabase/schema.sql` marks the submission approved, adds Seeds to the member and house, plants a forest item, awards badges and writes the activity log, all together or not at all.
- **Lightweight SVG art** (`components/forest/`): flat shapes, no image files, sharp on every screen.
- **Two storage modes behind one interface** (`lib/data/repo.ts`):
  - **Demo mode** (no setup): sample data lives in server memory (`lib/data/memory.ts`). It resets when the server restarts.
  - **Supabase mode**: switches on automatically when the Supabase keys are set (`lib/data/supabase.ts`).

```
app/            pages (App Router) and server actions
  admin/        Admin Control Room
  actions/      server actions: auth, member, admin
components/     shared building blocks (forest art, 3D ring, tilt, cards, forms)
lib/            game rules, house data, seed data, data layer, auth
supabase/       schema.sql (tables, security rules, functions) and seed.sql
scripts/        generate-seed-sql.ts (rebuilds seed.sql from lib/seed.ts)
presentation/   hackathon slide deck (PowerPoint, with speaker notes)
```

## Run it on your computer

You need [Node.js](https://nodejs.org) (the LTS version).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys it runs in **demo mode**: 9 houses, 30 members, 20 quests and ~200 forest items. On the login page you can start as a new student or jump into a sample account:

- **Saranda's top ranger**: a member with lots of trees
- **Saranda House Admin**: approves Saranda's quests
- **Programme Organiser**: super admin for all houses

### Running in GitHub Codespaces or Gitpod

Cloud editors show the site at a different address than the server sees, which Next.js normally treats as a forged form. `next.config.ts` allows `*.github.dev` and `*.gitpod.io`, so forms work there. If you ever see **"Invalid Server Actions request"**, your copy is out of date: run `git pull`, stop the site with **Ctrl + C**, and start it again with `npm run dev`.

## Put it online (Vercel + Supabase)

Demo mode keeps data in memory, so on Vercel it can reset or differ between servers. **Connect Supabase for the live, judged version.** It takes about 15 minutes.

1. **Supabase** → create a project called `wildlands`.
2. **SQL Editor** → New query → paste all of `supabase/schema.sql` → Run. Then do the same with `supabase/seed.sql`.
3. **Authentication → Providers → Email**: for the hackathon, turn **off** "Confirm email" so people can log in straight away. (Optional: enable Google and add its client ID/secret.)
4. **Authentication → URL Configuration**: set *Site URL* to your Vercel address and add `https://YOUR-SITE.vercel.app/auth/callback` to *Redirect URLs*.
5. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
6. **Vercel** → Add New Project → import this GitHub repo → under *Environment Variables* add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-SITE.vercel.app`
   
   → Deploy. Every push to GitHub updates the live site.
7. **Make yourself an admin**: sign up on the live site, then in Supabase SQL Editor run
   ```sql
   update profiles set role = 'super_admin' where handle = 'YOUR_HANDLE';
   ```
   (your handle is in your profile link, `/u/YOUR_HANDLE`). Promote house admins from *Admin → Members*.

> 🔐 Never put the Supabase **service role** key anywhere in this project. Wildlands only needs the public anon key; the database rules do the protecting. `.env.local` is ignored by git.

To run locally against Supabase, copy `.env.example` to `.env.local` and fill it in.

## 3-minute demo script

| Time | Show | Say |
| --- | --- | --- |
| 0:00 | Landing page with all nine forests | "New members drift away because they don't feel connected and their work goes unseen. Wildlands fixes that." |
| 0:20 | Sign up as a new student, onboarding, first seed appears | "In two minutes a newcomer learns their house's story and plants their first seed." |
| 0:50 | Admin creates "Attend Saturday meetup, +30", member submits, admin approves, tree sprouts | "Every contribution becomes something the whole house can see." |
| 1:40 | Habitat Card: badges, Tech/Sports/Culture chart, share | "A portfolio students actually want to share." |
| 2:10 | Admin overview: quiet members, activity log, lore editor | "Organisers run everything from their phone, no code." |
| 2:40 | This README's architecture section | "Next.js App Router, server components and actions, Supabase with row-level security, deployed on Vercel." |

Tip: open the admin and the member in two windows side by side. The house page refreshes itself every few seconds, so the tree appears on its own.

**Judge questions**
- *How do you stop cheating?* Every quest needs proof and admin approval, and every approval is logged.
- *Will it scale?* Supabase is a real Postgres database; Vercel serves pages from servers worldwide.
- *How is data kept safe?* Row Level Security in the database means members can only change their own data, even if someone tampers with the website.
- *Could a house actually use this?* Yes: it's live, free to run, and organisers manage it without code.

## Build notes

How it was built and tested, in the order of the Wildlands A-to-Z guide:

1. **Skeleton**: Next.js 15 App Router with TypeScript and Tailwind CSS 4.
2. **Database**: `supabase/schema.sql` creates the 10 tables (houses, profiles, quests, submissions, forest_items, badges, member_badges, lore_cards, trivia_questions, activity_log), the Row Level Security rules and the game functions. `seed.sql` is generated from `lib/seed.ts`, so demo mode and Supabase share exactly the same sample data.
3. **Login and pick a house**: email/password and Google through Supabase Auth. In demo mode, a cookie remembers which sample account you are using.
4. **House forest**: an SVG scene drawn from the `forest_items` rows. The scenery changes with the growth stage, and the forest wilts after 7 days without an approved quest.
5. **Questboard and proof**: photo uploads go to Supabase Storage (`proofs` bucket). In demo mode they are kept in memory.
6. **Approval queue**: one database function, `review_submissions()`, does all five approve steps as a single transaction.
7. **Onboarding, profile and badges**: badge rules are evaluated in TypeScript for demo mode (`lib/game.ts`) and in SQL for Supabase (`award_earned_badges()`).
8. **Rest of admin**: quest editor, badges, lore and trivia editor, members, activity log, overview.
9. **Polish**: liquid glass theme, 3D ring, diorama and tilt, phone dock, keyboard and screen-reader support, and reduced-motion support.

**How it was tested**
- `npm run build` passes with no type errors.
- `schema.sql` and `seed.sql` were loaded into a real PostgreSQL 16 database. The security rules were then checked as a member, a house admin, a super admin and a logged-out visitor:
  - a member can't change their own Seeds or role, approve their own proof, or submit for another house;
  - a house admin can't approve or reward another house's members, or create quests for all houses;
  - approving correctly adds Seeds, plants the tree, awards badges and writes the log.
- A headless browser runs the full demo loop on phone and desktop sizes: a new student signs up and finishes onboarding, an admin creates a quest, the student submits proof, the admin approves it, and the tree appears with the student's name.

**Known limits**
- Demo mode keeps data in server memory. It resets on restart and can differ between servers on Vercel, so connect Supabase for the live site.
- House colours and leader names are placeholders to replace with each house's real details (*Admin → House lore*).
- New rule-based badges created in Supabase mode are awarded at each member's next approval, not straight away.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally with live reload |
| `npm run build` | Production build (also checks types) |
| `npm run typecheck` | Type-check only |
| `npm run seed:sql` | Rebuild `supabase/seed.sql` after editing `lib/seed.ts` or `lib/houses.ts` |
