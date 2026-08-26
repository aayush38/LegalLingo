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

## Phase 2 — Email auth

Sign-in is a six-digit code sent to the citizen's email address
(`signInWithOtp({ email })` then `verifyOtp({ email, token, type: 'email' })`).
No password is set anywhere: one less thing to forget, to reset over a slow
connection, or to reuse from somewhere it has already leaked.

There is no separate sign-up step. `shouldCreateUser` is true, so a first-time
citizen and one returning to their documents take the same path.

Phone OTP was built first and then dropped: Indian SMS needs DLT registration
with a telecom operator, and a Twilio trial cannot send it (trial accounts
reject custom message bodies, cap at five verified recipients, and expire after
30 days). `src/lib/auth/phone.ts` is kept for `profiles.phone`, which is a
contact number rather than the login identity.

### The blocker before launch: SMTP

Supabase's built-in mailer **only delivers to addresses on the project
organisation's team**, with a small per-hour cap, no SLA, and an explicit
warning against production use. Every other address is refused. That is why a
sign-in attempt from an ordinary address currently fails.

A custom SMTP server is therefore required before real citizens can sign in.
Any SMTP service works — Resend, AWS SES, Postmark, SendGrid, ZeptoMail, Brevo.
Configure it at Authentication → SMTP, or through the Management API. The
initial rate limit after enabling is 30 messages/hour, adjustable on the Rate
Limits page.

Supabase also recommends CAPTCHA on email auth, because bot signups against an
open email flow are a standard way to burn a sending domain's reputation.

### Verified

Everything except the code round-trip itself, which cannot be exercised from
here because the built-in mailer will not deliver to a test address and the
inbox is not readable.

- 20 unit tests on address parsing: case and whitespace normalisation, a line
  break pasted into the middle of an address, and the malformed shapes.
- 26 browser tests: the field is `type=email` with `autocomplete=email`,
  validation blocks the request before it is sent, the address that reaches
  Supabase is lower-cased and trimmed, and the real error that comes back is
  rendered as a translated, actionable message rather than raw provider text.
- The profile trigger mirrors `auth.users.email` into `profiles.email`.
- The navbar shows the address masked (`le•••••@example.com`), and sign-out
  returns to the guest state.

The gap is entering a real code. Once custom SMTP is configured, that is the
one path still to confirm by hand.

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
