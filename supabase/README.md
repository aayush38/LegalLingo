# LegalLingo — Supabase

**Project ref:** `sdxhtyryvlxqlowbbhnk` · **Region:** `ap-south-1` (Mumbai) · **Plan:** Free

Mumbai rather than the default: the users are in India, and every millisecond of
round-trip shows up on a slow phone connection.

## Pulling the schema locally

The seven Phase 1 migrations are applied and recorded server-side. To bring them
into this repo as versioned files (requires an interactive Supabase login):

```bash
npx supabase login
npx supabase link --project-ref sdxhtyryvlxqlowbbhnk
npx supabase db pull
```

After any schema change, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id sdxhtyryvlxqlowbbhnk \
  > src/lib/supabase/database.types.ts
```

## Migrations applied

| # | Migration | What it does |
|---|-----------|--------------|
| 1 | `enums_and_helpers` | Enums mirroring the TypeScript unions; `set_updated_at()` |
| 2 | `profiles` | User profile, auto-created on signup; Aadhaar last-4 constraint |
| 3 | `document_core` | `document_sets` → `documents` → `document_pages` |
| 4 | `analysis_core` | `analyses`, `clauses`, `risk_findings`, `extracted_facts`, `checklist_items` |
| 5 | `row_level_security` | RLS on all nine user tables, 36 policies |
| 6 | `storage_and_translation_cache` | Private `documents` bucket; shared translation memory |
| 7 | `harden_trigger_functions` | Revokes RPC access to the two trigger functions |

## Shape

```
auth.users
  └── profiles              (1:1, auto-created by trigger)

document_sets               one upload submission
  ├── documents             the files in it (primary + supporting)
  │     └── document_pages  per-page text, what the chunker reads
  └── analyses              one row per analysis run (is_current flags the live one)
        ├── clauses         simplified clauses of the primary document
        ├── risk_findings   deterministic Risk Engine output, with evidence
        ├── extracted_facts key values mined from supporting documents
        └── checklist_items the action checklist (the mutable part)
```

## Decisions worth knowing

**`auth_uid` is denormalised onto every table.** Ownership is one indexed
comparison, never a join. Legal documents are the most private thing this app
handles, and a join-based policy is one careless schema change away from
widening. It also keeps RLS off the query planner's critical path.

**Full Aadhaar numbers cannot be stored.** `profiles.aadhaar_last4` carries a
`CHECK (aadhaar_last4 ~ '^[0-9]{4}$')`. Storing 12 digits is a database error,
not a code review finding — no future code path can quietly regress it. The
Phase 3 flow OCRs the card in the browser, keeps the last four digits and the
printed name, and discards the rest.

**Analyses keep both normalised rows and the full JSON.** `analysis_json` holds
the complete `DocumentAnalysis` so a saved document rehydrates exactly as it was
rendered, including fields added to the type later that have no column yet. The
normalised tables exist for querying and for genuinely mutable state.

**Translation columns are jsonb maps keyed by language** (`{"en": ..., "hi": ...}`),
so Phase 4 can cache a translation per clause instead of re-translating on
every view. `translation_cache` is shared rather than per-user because legal
boilerplate repeats heavily across documents; it is written only by the server.

**`risk_findings.legal_basis` is deliberately null.** Reserved for the RAG
phase. A citation must come from a retrieved source, never a hardcoded guess.

**Guests write nothing here.** Guest mode stays in `localStorage`, so no
anonymous auth user is created and no row is written.

## Verified

RLS was tested against a planted row, not an empty table: with a real
`document_sets` row present, the anon key returned `[]` on select (unfiltered
and filtered by known id), `401` on insert, and a `204` that deleted nothing.
The security advisor reports zero lints.

## Phase 2 — Email and password auth

Sign-in is email + password (`signInWithPassword`). Sign-up creates the account
in the same modal; there is no separate registration page.

### Why not one-time codes

The first attempt used `signInWithOtp` and a six-digit code box. That was wrong
twice over, and both are worth recording:

**Supabase sends a magic link by default, not a code.** From their docs: *"Though
the method is labelled 'OTP', it sends a Magic Link by default. The two methods
differ only in the content of the confirmation email."* Getting a six-digit code
requires editing the Magic Link email template to use `{{ .Token }}`. The code
box was therefore asking for something the emails never contained.

**The link itself could not work.** `@supabase/ssr` uses the PKCE flow, where the
emailed token must be exchanged by the application, not by Supabase's own verify
endpoint. With the default template the exchange never happened and every link
failed with `otp_expired` — the token was not expired, it was never redeemed.

Passwords also solve a practical problem: **signing in sends no email at all.**
Given that the built-in mailer allows only a handful of messages an hour, an
emailed code would simply fail for the third citizen of the hour. A password
costs one email at sign-up and none afterwards.

### Required dashboard settings

Two of these are not optional — links will keep failing without them.

1. **URL Configuration → Site URL**: `http://localhost:3000` in development,
   the real origin in production. Emailed links are built from this.

2. **Email Templates** — point them at the application, not at Supabase:

   *Confirm signup:*
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your account</a>
   ```

   *Reset password:*
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
   ```

3. **Optional, for development:** Authentication → Providers → Email → turn
   **Confirm email** off. Sign-up then creates a session immediately and the
   whole flow needs no email whatsoever. Turn it back on before real users.

4. **Custom SMTP is still required for production.** The built-in mailer only
   delivers to the organisation's own team addresses.

### Routes

`/auth/confirm` exchanges an emailed token for a session. It validates that
`next` is a same-origin path, so a crafted link cannot bounce a freshly
authenticated citizen to another site, and it redirects to `/?auth_error=...`
rather than showing a raw provider message.

`/auth/set-password` is where a recovery link lands. An account created by the
earlier magic-link flow has no password its owner knows; this is how they set
one. Both routes are exempt from the onboarding gate, because they are reached
from an email on a device that may never have opened the app.

### Verified

Signed in through the real UI, which the one-time-code flow never managed:

- wrong password is rejected with "That email or password is not correct" — the
  same message whether or not the account exists, so this cannot be used to
  discover who has one
- the correct password signs in, the chip shows `ci•••••@example.com`, and the
  session survives a reload
- **no network call to any email endpoint during sign-in**, asserted by
  intercepting requests
- sign-out returns to the guest state
- `/auth/confirm` handles a missing token, a garbage token, and an off-site
  `next` without a 500

21 browser assertions, plus 115 unit tests.

## Phase 2.5 — Document persistence

Signed-in analyses are written across the schema by
`src/lib/persistence/saveAnalysis.ts` and read back by `loadDocuments.ts`.

**No transaction, so rollback is explicit.** PostgREST cannot span tables in one
transaction. Every write therefore runs inside a try/catch that deletes the
`document_set` on failure, and the foreign keys cascade the partial rows away. A
half-written deed in someone's list is worse than no deed: they would believe it
was saved with its clauses missing.

**`analysis_status` is the completeness flag.** A set is inserted as
`processing` and only flipped to `complete` once every child row is in. The read
path filters on `complete`, so an interrupted save can never surface as a
document.

**Storage upload is last and non-fatal.** The simplified text is what the
citizen came for; a failed scan upload is reported but does not discard a
finished analysis. `SaveResult.failedUploads` names any file whose bytes did not
make it.

**Signed-in documents are never mirrored into localStorage.** Otherwise copies
of someone's legal documents would remain on a shared or borrowed handset after
they sign out.

**Checklist ticks are the one mutable field**, which is why they live in their
own table rather than only inside `analysis_json`. On load the ticks are merged
back over the stored snapshot.

### Verified end to end

Phone auth is still off, so the tests mint a real session a different way: two
confirmed email/password users created directly in `auth.users` (with the
GoTrue token columns set to `''` — left NULL, every login fails with "Database
error querying schema"), then a password grant, then the session cookie
(`sb-<ref>-auth-token`, `base64-` prefixed) injected into Playwright.

With that real session: rows land in all eight tables, roles and `doc_type`
survive, originals reach the private bucket, `is_current` is set, risk findings
keep their evidence, and `legal_basis` stays null. A second signed-in user sees
`[]` in every one of those tables. Deleting removes the rows **and** the stored
originals. A guest running the same analysis issues no write of any kind and the
account stays empty.

Test users and all their data were deleted afterwards; every table is back to
zero rows.

## Phase 3 — Landing page, profile, Aadhaar, identity

### First-run landing (`/welcome`)

Two steps: choose a language, then choose whether to have an account. Language
comes first deliberately — everything after it, including the question about
signing in, is then asked in a language the citizen actually reads rather than
making them agree to something in English first.

`OnboardingGate` sends first-time visitors there. It reads the flag with
`useSyncExternalStore` rather than an effect, which avoids both a hydration
mismatch and a flash of the main page being yanked away.

`legallingo_onboarded` joins `legallingo_language` as the only two things on the
device. Both are UI preferences; still no documents.

### Aadhaar

Read by the same browser OCR the documents use. **The image is never uploaded**
— verified by intercepting network traffic during the read — and the full
twelve-digit number never leaves `extractAadhaar`. What is saved is
`aadhaar_last4` and the printed name.

Two things make this more than a regex:

**Verhoeff checksum.** Aadhaar numbers are check-digit protected. Running it
means a stray twelve-digit string on the card — an enrolment id, a phone number,
an OCR misread — is rejected instead of being stored as somebody's Aadhaar.
Tested against every single-digit mutation and every adjacent transposition of a
valid number: all rejected. A failed checksum is reported as "take a sharper
photo", not as a bad card.

**A 16-digit VID is not an Aadhaar number.** It contains valid-looking 12-digit
substrings; accepting one would store the wrong last four digits.

### Identity check

`verifyIdentity` compares the name on the card against the parties in the open
document, reusing `compareNames` from the Risk Engine. Four verdicts:

- `CONFIRMED` — the name appears, spelled the same.
- `LIKELY` — present but abbreviated. "Ramesh V. Patil" against "Ramesh Vithal
  Patil" is the commonest benign difference in Indian records; calling it a
  mismatch would send people to a lawyer over nothing.
- `NOT_NAMED` — the document names people and none is this citizen. Styled as a
  warning, because being handed a deed naming someone subtly different is a real
  way for a sale to be undone later.
- `UNKNOWN` — nothing to compare. Better silence than telling someone they are
  "not named" in a document whose parties simply could not be extracted.

It never says a document is valid or invalid. It says whether two names agree.

### A bug worth recording

The name extractor originally anchored on "the line above the date of birth".
A PDF text layer yields the whole card as one run with no newlines, so there was
no such line and no name was ever returned — while all 18 unit tests passed,
because they used neatly-lined-up card text. Caught only by running a real card
through the real OCR path. The extractor now segments on printed card phrases
rather than newlines, and five regression tests cover the single-run shape.

### Deleting an account: order matters

Supabase blocks direct deletion from `storage.objects` ("Use the Storage API
instead"), so removing a user does **not** remove their uploaded scans — the
database rows cascade away and the files stay.

Account deletion must therefore delete files through the Storage API **first**,
while the owner's session still exists, and remove the user second. The in-app
`deleteDocumentSet` already does this for a single document; a full
account-deletion flow does not exist yet and is the remaining gap for a right-to-
erasure request.
