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
- **Tailwind CSS 4** for styling. Mobile-first with a bottom tab bar on phones.
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
components/     shared building blocks (forest art, cards, forms)
lib/            game rules, house data, seed data, data layer, auth
supabase/       schema.sql (tables, security rules, functions) and seed.sql
scripts/        generate-seed-sql.ts (rebuilds seed.sql from lib/seed.ts)
```

## Run it on your computer

You need [Node.js](https://nodejs.org) (the LTS version).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys it runs in **demo mode**: 9 houses, 30 members, 20 quests and ~200 forest items. On the login page you can start as a new student or jump into a sample account:

- **Rahul Verma**: Saranda member
- **Saranda House Admin**: approves Saranda's quests
- **Programme Organiser**: super admin for all houses

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

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally with live reload |
| `npm run build` | Production build (also checks types) |
| `npm run typecheck` | Type-check only |
| `npm run seed:sql` | Rebuild `supabase/seed.sql` after editing `lib/seed.ts` or `lib/houses.ts` |
