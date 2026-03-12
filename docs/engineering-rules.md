
---

## `/docs/engineering-rules.md`

```md
# Engineering Rules

- One public page per parent event
- Multiple event dates appear inside the same page
- No public sitewide event search
- Tickets are sold by zone, not exact seat
- Seats together are implied by default
- If together seating cannot be fulfilled, order must go to exception/refund flow
- Local development must remain compatible with future Google Cloud Run deployment
- App must be stateless
- Persistent data must live in PostgreSQL
- Config must come from environment variables
- Docker-first local development
- Stripe in test mode for MVP
- Storage and email must be abstracted for future Google Cloud adapters