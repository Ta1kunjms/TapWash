# TapWash Pitch Deck: Canva Execution Guide
## Quick Reference for Rebuilding in Canva

---

## CANVA SETUP CHECKLIST

### Brand & Design System
- [ ] Create Canva Team project (or personal project)
- [ ] Import TapWash logo (512x512px recommended)
- [ ] Define color palette:
  - Primary: [YOUR PRIMARY COLOR] (e.g., teal/blue)
  - Accent: [ACCENT COLOR] (e.g., warm green or orange)
  - Neutral: #333 (dark gray for text), #F5F5F5 (light gray for backgrounds)
  - Alert: #EF4444 (red for risks/warnings)
- [ ] Select typography:
  - Headlines: [CLEAR, MODERNITY FONT] (e.g., Sora, Poppins Bold, DM Sans)
  - Body: [READABLE FONT] (e.g., Inter, Open Sans, Mulish Regular)
  - Set sizes: H1 = 48–56px, H2 = 32–40px, Body = 14–16px
- [ ] Create brand elements in Canva library:
  - Logo variations (primary, white, icon only)
  - Icon set (5–10 core icons: shop, customer, rider, delivery, check, warning, etc.)
  - Badge templates (Implemented, Pilot Validation, Projected)
- [ ] Set slide dimensions: 1920x1080px (16:9 widescreen) or 1440x810px if importing to PDF later

### Slide Template Creation
- [ ] Create master slide layout:
  - Background: solid color or subtle gradient
  - Slide number + "TapWash" footer (position bottom-right, small gray text)
  - Title area (top-left or center, 40% of slide height)
  - Content area (60% of slide height, with breathing room)
- [ ] Create 3 template variants:
  - Title slide (centered, large headline + tagline)
  - Section slide (headline + 2–3 bullet columns)
  - Data slide (headline + table/chart + notes area)

---

## SLIDE-BY-SLIDE CANVA BUILD INSTRUCTIONS

### Slide 1: Title / Cover
**Layout:**
- Background: Soft gradient (primary color to accent color, bottom-right emphasis)
- Center: TapWash logo (high-res, 256px width)
- Below logo: "TapWash" (headline, 56px, bold)
- Below headline: "Connecting Customers with Verified Laundry Shops" (tagline, 28px, lighter weight)
- Optional bottom half: Split-screen mockup of customer phone + shop dashboard (use UI screenshots if available)

**Canva Elements to Add:**
- [ ] Insert logo
- [ ] Add text: "TapWash"
- [ ] Add text: tagline
- [ ] Optional: Insert phone frame graphic (from Canva library) with laundromat app screenshot
- [ ] Add subtle decorative elements (icons: shop, rider, location pin) at corners

**Export Notes:** Export as PDF; use for printing or Vercel deploy.

---

### Slide 2: The Problem
**Layout:**
- Left column (60%): 3 numbered sections
  - "1. Customer Pain" + 3 bullet points (icon: frustrated face)
  - "2. Shop Owner Pain" + 3 bullet points (icon: shop)
  - "3. Market Context" + 3 data points (icon: chart)
- Right column (40%): Static image or illustration of pain (e.g., confused customer on phone, overwhelmed shop owner)

**Canva Elements:**
- [ ] Add 3 icons (customer, shop, chart) from library
- [ ] Add 3 text boxes with bullet lists
- [ ] Add 1 image (optional: photo or illustration of problem state)
- [ ] Color backgrounds of each section lightly (soft accent color)

**Data to Fill In:**
- Customer Pain: confirm 3 points from Slide 2 copy (phone calls, no pricing, no tracking, etc.)
- Shop Owner Pain: confirm 3 points (random orders, manual invoicing, no data, etc.)
- Market Context: ₱15B market, 75–85% offline, smartphone penetration 70%, e-commerce CAGR 18%

---

### Slide 3: The Solution
**Layout:**
- 3 equal columns: "For Customers" | "For Shop Owners" | "For the Platform"
- Each column: 1 headline + 2–3 key features as bullet points + 1 icon at top

**Canva Elements:**
- [ ] Draw 3 vertical dividers (or use background color blocks)
- [ ] Add 3 column headers (28px, bold, primary color)
- [ ] Add 9 bullet points (14px, regular weight)
- [ ] Add 3 icons (mobile + person for customers; dashboard + tools for shops; lock + network for platform)
- [ ] Optional: Add 1 small screenshot per column (3 phone screens or dashboard mockups)

**Design Notes:** Keep spacing even; use left margins for bullets. Use icons to break up text.

---

### Slide 4: Product Demo (Customer Journey)
**Layout:**
- Horizontal flow: 4 numbered steps left-to-right
- Each step: 1 phone screenshot / mockup + 1 headline + 2–3 description bullets

**Canva Elements:**
- [ ] Insert or create 4 phone frames (from library or custom rects, 200px width each)
- [ ] Add screenshots inside frames (or placeholder "Screenshot #1" text)
- [ ] Add step numbers (large, circled: ①②③④)
- [ ] Add arrows connecting steps (→)
- [ ] Add 1 headline per step (e.g., "Discover" "Book", "Checkout", "Track")
- [ ] Add 2–3 bullet points per step (12px, gray text)

**Alternative Layout (if horizontal is cramped):**
- Vertical flow (top to bottom), 2 columns of 2 steps; each step gets 25% of slide

**Data to Fill In:**
- Step 1 (Discover): 2–3 bullets on shop search, ratings, distance
- Step 2 (Book): 2–3 bullets on service selection, pricing updates
- Step 3 (Checkout): 2–3 bullets on total review, voucher, payment selection
- Step 4 (Track): 2–3 bullets on map, notifications, timeline

---

### Slide 5: Business Model
**Layout:**
- Top half (60%): 3 revenue streams displayed as boxes/cards
  - "Commission (80–85%)" → icon: coins
  - "Premium Features (10–15%)" → icon: star
  - "Voucher Partnerships (5–10%)" → icon: ticket
- Bottom half (40%): Unit economics table (small, readable)

**Canva Elements:**
- [ ] Create 3 colored boxes (primary, accent, neutral) for revenue streams
- [ ] Add headline + 1 description line per box (14px)
- [ ] Add 1 icon per box
- [ ] Insert table (or create as text groups):
  - Columns: Metric | Value | Notes
  - Rows: AOV | Commission % | Gross Margin | Operating Cost | Net Margin

**Table Placeholder (Copy from Slide 5 Blueprint):**
```
| AOV | ₱650 | Mix of wash-and-fold, dry clean |
| Commission Rate | 12% | Conservative via admin controls |
| Gross Margin | ₱78 | 12% × ₱650 |
| Operating Cost/Order | ₱45 | Servers, push, support, etc. |
| Net Margin/Order | ₱33 | ₱78 − ₱45 |
| Orders to Breakeven | ~2,000/mo | Assumes ₱66K fixed costs |
```

**Design Notes:** Make table readable (small font OK; it's a summary). Use alternating row backgrounds for clarity.

---

### Slide 6: Traction & Progress
**Layout:**
- Left column (40%): 5 status badges (color-coded boxes)
  - GREEN: "✓ Product Built & Live"
  - GREEN: "✓ Technology Validated"
  - YELLOW: "⊗ Beta Shops Onboarded"
  - YELLOW: "⊗ Pilot Metrics (4-Week)"
  - BLUE: "↗ Key Upcoming (8 Weeks)"
- Right column (60%): Metrics summary
  - "Signups: 150" "Conversion: 53%"  "AOV: ₱680" "ETA: 52 min" "Satisfaction: 4.3/5"

**Canva Elements:**
- [ ] Create 5 colored boxes (green for done, yellow for in-progress, blue for upcoming)
- [ ] Add checkmarks/status icons
- [ ] Add text inside boxes (headline + 2–3 key points)
- [ ] Create 5 metric callouts on right (large number + small label)
- [ ] Add optional: small trend arrows or sparkle icons

**Data to Update (Post-Pilot):**
- Replace "Pilot Metrics" placeholders with actual numbers from Month 4–6
- Update shop count and customer count real-time

---

### Slide 7: Market Opportunity
**Layout:**
- Top half: TAM table (3 rows × 5 columns: Segment | HH / Businesses | TAM | Penetration | Addressable)
- Bottom half: 2 callouts
  - "Growth Drivers" (4 bullet points)
  - "TAM Capture Thesis" (3 bullet points)

**Canva Elements:**
- [ ] Insert table (or create as grouped text) with TAM data (from Slide 7 copy)
- [ ] Add "TAM Table" headline (28px, primary color)
- [ ] Create 2 text boxes below (Growth Drivers, Capture Thesis)
- [ ] Optional: Add 1 map image (Philippines highlighted, focus on Metro Manila)
- [ ] Optional: Add 1 bar chart showing TAM breakdown (Residential | Commercial | Dry Clean)

**Key Numbers to Highlight:**
- ₱15B total market
- ₱500M addressable at 5% penetration
- 3–5% capture by Year 3 thesis

---

### Slide 8: Go-to-Market Strategy
**Layout:**
- Timeline: 3 horizontal phases
  - Phase 1 (Months 1–4): "Pilot" + 5 bullets
  - Phase 2 (Months 5–12): "Expand" + 5 bullets
  - Phase 3 (Year 2): "Multi-City" + 3 bullets
- Bottom: CAC Table (4 rows × 3 columns: Channel | CAC | Payback)

**Canva Elements:**
- [ ] Create timeline: 3 boxes or cards connected with arrows
- [ ] Add phase labels and bullets inside each
- [ ] Add table below (or use text callouts)
- [ ] Optional: Add map graphic showing initial pilot zone (MRT Taguig + BGC)
- [ ] Add 1 icon per phase (rocket for pilot, chart for expand, globe for multi-city)

**Design Notes:** Make timeline clear; allow enough space for text. Use consistent colors across phases.

---

### Slide 9: Competition & Moat
**Layout:**
- Left column (50%): Competitive positioning matrix
  - X-axis: Horizontal Scale ← → Vertical Focus
  - Y-axis: Generic ← → Specialized
  - Plot competitors (Grab Food, GoBusiness, Offline Shops, TapWash = upper-right)
- Right column (50%): 4 moat pillars (small boxes)
  - "Supply-Side Network"
  - "Data Advantage"
  - "Category Expertise"
  - "First-Mover Credibility"

**Canva Elements:**
- [ ] Create 2D scatter plot (coordinate axes + quadrants; use Canva shapes or import chart)
- [ ] Add competitor labels (Grab Food, GoBusiness, Offline, TapWash) as points
- [ ] Add 4 moat pillar boxes (stacked or grid) with icons + 1-line descriptions
- [ ] Optional: Add color gradient background to plot (TapWash's quadrant highlighted)

**Design Notes:** Make matrix clear and intuitive. Use distinct colors for each competitor.

---

### Slide 10: Operations & Delivery Excellence
**Layout:**
- Top half: 6 operational pillars displayed as cards / grouped text
  1. "Shop Verification"
  2. "Real-Time Tracking"
  3. "Push Notifications"
  4. "Ratings & Accountability"
  5. "Dispute Resolution"
  6. "Rider Safety & Incentives"
- Bottom half: SLA Table (3 rows × 4 columns: Metric | Pilot Target | Steady-State | Owner)

**Canva Elements:**
- [ ] Create 6 small boxes (2 rows × 3 columns) with 1 icon + headline per box
- [ ] Add 1–2 lines of description (10px, gray) under each headline
- [ ] Insert SLA table below
- [ ] Use muted background colors for cards to create visual hierarchy
- [ ] Optional: Add 1 image showing order flow (from customer → shop → rider → delivery)

**Design Notes:** Ops slide should feel organized and systematic. Tables + cards are best format.

---

### Slide 11: Financial Projections
**Layout:**
- Headline: "Path to Profitability: Conservative / Base / Stretch Scenarios"
- 3 tables (Conservative, Base, Stretch) displayed side-by-side or stacked
- Each table: 5 rows (Year 1, 2, 3) × 8 columns (Shops, Customers, Orders, GMV, Revenue, OpEx, EBITDA, Notes)
- Optional below: Line chart showing EBITDA trajectory (Year 1 → 2 → 3) across all 3 scenarios

**Canva Elements:**
- [ ] Create 3 tables (or import from spreadsheet as images)
- [ ] Add column headers (black background, white text) for readability
- [ ] Highlight key rows: Year 1 (red/loss), Year 2 (green/profitable), Year 3 (bright green/high margin)
- [ ] Optional: Add line chart below showing Year 1 (−₱800K), Year 2 (+₱2M–₱10M), Year 3 (+₱12M–₱45M)
- [ ] Add 1 callout: "Breakeven by Month 18" (22px, bold, accent color)

**Design Notes:** Tables can be tight (small text OK for handouts). If exporting to PDF, ensure 12pt font minimum.

**Data Source:** Copy tables from Slide 11 Blueprint.

---

### Slide 12: Risks & Mitigations
**Layout:**
- Risk matrix (2D): Y-axis = Severity (Low | Medium | High), X-axis = Likelihood (Low | Medium | High)
- Plot 7 risks as circles/dots in matrix
- Legend below: Show mitigation for each risk (7 rows)

**Alternative Layout:** 7 risk cards (stacked or grid) each with:
- Risk headline (e.g., "Supply-Side Friction")
- Severity badge (Medium | High)
- 2-line mitigation
- Validation gate

**Canva Elements:**
- [ ] Create 2D matrix (axes, 9 quadrants)
- [ ] Add 7 risk labels as points (use different colors or sizes to distinguish)
- [ ] Add legend below with risk number, name, mitigation
- [ ] Optional: Add 1 icon per risk (friction icon, person icon, chart, lock, shield, etc.)

**Design Notes:** Make matrix clear. Risk communication should feel serious but manageable (not alarmist).

---

### Slide 13: Roadmap
**Layout:**
- Horizontal timeline: Phase 1 | Phase 2 | Phase 3 | Phase 4 (each takes 25% of width)
- Above timeline: 3–5 key milestones per phase (as bullets inside boxes)
- Below timeline: Feature backlog table (compact)
- Optional: Financial milestones callouts (GMV + EBITDA targets)

**Canva Elements:**
- [ ] Create timeline (4 connected boxes or infinite ribbon)
- [ ] Add phase labels (Months 1–6 | 7–12 | 13–18 | 19–36)
- [ ] Add 3–5 bullet points per phase (inside boxes)
- [ ] Add feature backlog as table (5 rows: Feature | Target Month | Why | Evidence)
- [ ] Add financial milestone callouts below (₱2M–₱3M GMV by Month 6, etc.)
- [ ] Color-code phases (pilot = blue, expand = green, scale = purple, multi-city = gold)

**Design Notes:** Keep text concise. Timeline should be visual, not a list.

---

### Slide 14: Team & Founding Story
**Layout:**
- Top half: Team members (headshots or placeholder avatars)
  - Founder/CEO: Large photo + 3-line bio
  - Co-Founder/CTO: Medium photo + 3-line bio
  - Advisor (optional): Medium photo + 2-line bio
- Bottom half: Hiring plan table (4 rows: Role | Month | Why | Impact)

**Canva Elements:**
- [ ] Insert team photos (or create circular avatars if photos not available)
- [ ] Add bios as text (12–14px, left-aligned)
- [ ] Add 1 icon per team member (rocket for founder, code for CTO, lightbulb for advisor)
- [ ] Insert hiring plan table
- [ ] Optional: Add "Track Record" callout (e.g., "Built [Company] to ₱50M, Exited to X")

**Design Notes:** Make team feel human and credible. Bios should highlight relevant experience, not full CV.

---

### Slide 15: Support & Resources Needed
**Layout:**
- 5 equal sections (cards or stacked boxes):
  1. "Shop Partnerships" (High Priority)
  2. "Customer Insights" (High Priority)
  3. "Mentorship" (Medium Priority)
  4. "Community Partnerships" (Medium Priority)
  5. "Capital (Optional)" (Low Priority)
- Each section: Headline + 2 lines description + 1 call-to-action

**Canva Elements:**
- [ ] Create 5 boxes (use priority colors: red/orange for high, yellow for medium, blue for low)
- [ ] Add priority badge (small label, top-right of each box)
- [ ] Add headline (bold, 18px) + description (14px) + CTA (12px, italicized or different color)
- [ ] Optional: Add 1 icon per section (handshake, chart, coffee, people, coin)

**Design Notes:** Keep asks specific and actionable. Don't make it sound desperate; frame as "we're open to X" not "we need X."

---

### Slide 16: Vision & Closing
**Layout:**
- Centered, minimal design
- 1 large vision statement (36–48px, bold, primary color)
- 5 callouts around it (what success looks like):
  - "1M+ Customers"
  - "₱2B+ Annual GMV"
  - "10,000+ Shops"
  - "Regional Brand"
  - "SE Asia Expansion"
- Bottom: Final quote or call-to-action (24px, accent color)

**Canva Elements:**
- [ ] Add vision statement centered (large, bold)
- [ ] Create 5 stat callouts (use badges or large text with icons)
- [ ] Add bottom quote or call-to-action (italicized, accent color)
- [ ] Optional: Subtle background image (map of Asia, customer silhouettes, etc.)

**Design Notes:** Closing should feel inspiring but grounded. Use whitespace generously.

---

## APPENDIX SLIDES (A–E) – BUILD NOTES

### Appendix A: Unit Economics Deep Dive
- Format: 2 tables (order breakdown + sensitivity analysis) + 1 text section (key insights)
- Canva: Use very small text (10–11px); use alternating row colors for readability
- Optional: Add waterfall chart showing how ₱650 AOV flows to ₱33 margin

### Appendix B: Operations SLA Tracking
- Format: 1 large table (SLA targets) + 1 decision tree diagram (incident response) + 1 quality tier pyramid
- Canva: Table in 10–11px; decision tree as connected boxes/diamonds; pyramid as 4 stacked sections

### Appendix C: Data Security & Compliance
- Format: 1 architecture diagram + 2 compliance tables (PH + Regional)
- Canva: Import or recreate architecture diagram; use tables for compliance requirements

### Appendix D: Technology Architecture
- Format: 1 architecture diagram (high-level) + 1 scaling table + 1 SQL code block
- Canva: Diagram can be Canva shapes or imported image; tables for scaling; code block as monospace text

### Appendix E: Validation Roadmap
- Format: Assumption hierarchy table + 12-month timeline + sample dashboard mockup
- Canva: Tables for assumptions; timeline as 12 monthly boxes; dashboard as mockup or text layout

---

## EXPORT & DELIVERY

### PDF Export
1. In Canva: Design → Download → PDF (standard)
   - Slide size: 1920x1080 exports to high-res PDF
   - Create separate PDFs: "TapWash_PitchDeck_16slides.pdf" (core) + "TapWash_PitchDeck_21slides_Full.pdf" (with appendix)

### Presentation Mode
1. Share link: Canva allows live presentation mode (Alt+P or Share → Present)
2. Speaker notes: Add to each slide in Canva's speaker notes field (below slide editor)
3. Tips: Practice presenter view; note timings (7-min = quick pacing, 12-min = normal, 18-min = detailed)

### Handout / Pitch Memo
1. Export slides as images (1–2 per page) with speaker notes on facing page
2. Combine with this Blueprint document as reference
3. Print 2-up or single-slide format depending on audience

### Digital Sharing
1. Canva link: Generate shareable link (Design → Share → Get Link); set to "view only"
2. PDF for email: Use "Download as PDF" for email distribution
3. Figma/Design Handoff: If needing iterations with designer, export source and re-import

---

## QUICK REFERENCE: WHAT TO EMPHASIZE IN CANVA DESIGN

✓ **Clarity over Fancy:** Readable text, clear hierarchy, whitespace.  
✓ **Visual Hierarchy:** Biggest text = most important idea; color differentiation for status/priority.  
✓ **Consistency:** Same fonts, color palette, icon style across all slides.  
✓ **Data Visibility:** Tables and charts should be scannable (10-12pt min for handouts, 14pt+ for projected).  
✓ **Emotion + Logic:** Persona-tagged narratives (customers, shops) + hard data (unit economics, FP projections).  
✓ **Evidence Tagging:** Use visual badges (Implemented, Pilot, Projected) to ground credibility.  
✓ **Screenshots > Mockups:** If you have real TapWash UI screenshots, use them. Mockups OK if polished.  
✓ **Speaker Notes Ready:** Every slide should have 2–3 minute explanatory notes (for 12-min version) or 1-minute essentials (for 7-min version).

---

## COMMON DESIGN MISTAKES TO AVOID

❌ Overcrowding: Too many bullet points, tables, or graphics on one slide.  
→ Better: One idea per slide; use Appendix for detail.

❌ Inconsistent fonts: Mix of 5+ different typefaces.  
→ Better: 2 fonts max (1 for headlines, 1 for body); consistent sizes.

❌ Poor color contrast: Light text on light background or vice versa.  
→ Better: High contrast (dark on light or light on dark); test readability projector.

❌ Meaningless animations: Slide transitions that distract from message.  
→ Better: No animations or minimal fade-ins; keep focus on content.

❌ Missing context: Data without labels or assumptions.  
→ Better: Every number has a label and a one-line source/note.

❌ Copy-paste errors: Typos, inconsistent terminology, old dates.  
→ Better: Proofread 2x before sharing; use consistent terminology across deck.

---

## FINAL CHECKLIST

- [ ] All 16 core slides built in Canva
- [ ] All 5 appendix slides built (or prepared as backup)
- [ ] Speaker notes added to every slide (short + long versions)
- [ ] TapWash logo and brand colors applied consistently
- [ ] All data points tagged (Implemented / Pilot / Projected)
- [ ] Tables and charts proofread (numbers, column headers, sources)
- [ ] Screenshots (if any) are high-res and on-brand
- [ ] PDF exports tested (layout OK, text readable)
- [ ] Shared with 1–2 advisors for feedback
- [ ] Presentation practiced (7-min + 12-min + 18-min versions)
- [ ] Backup files created (Canva link + PDF + speaker notes doc)

---

## NEXT STEPS (After Canva Build)

1. **Email Slide Master to Advisors:** "Here's the deck. Feedback by [DATE]?"
2. **Record Voiceover (Optional):** Use Canva's built-in recording or export slides → Keynote/PowerPoint → record separately
3. **Practice Delivery:** Record yourself delivering 7-min version; time it, iterate
4. **Update with Real Data:** Once pilot is live (Month 3–4), swap placeholder metrics with actuals
5. **Create Leave-Behind:** 1-page exec summary of deck points for post-presentation handouts
6. **Schedule Live Pitch:** Set date for capstone defense or investor meeting; prep Q&A

