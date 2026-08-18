# WMS-9 Design Directions

## Approach A — Decision Operations Terminal

**Very Brief Intro:** A high-clarity industrial control room where the Decision Ledger acts as the operating record. Dense information is balanced with deliberate breathing space and visible action paths.  
**Probability:** 0.07

## Approach B — Warehouse Blueprint

**Very Brief Intro:** A light, spatial interface inspired by racking maps, pick paths, and engineering schematics. It makes operational movement feel tangible and geographic.  
**Probability:** 0.04

## Approach C — Signal-First Command Deck

**Very Brief Intro:** A dark, alert-oriented command surface using bold signal colors and compact cards to foreground exceptions and deadlines. It favors immediacy over exhaustive detail.  
**Probability:** 0.09

---

# Chosen Direction — Decision Operations Terminal

## Design Movement

This direction draws from **industrial control rooms and contemporary operational intelligence software**. It respects the supplied WMS-9 graphite palette while using the Decision Ledger as a persistent visual narrative rather than an isolated audit list.

## Core Principles

1. **Action before observation:** each operational condition carries a next action, rationale, or unblock path.
2. **Signal hierarchy:** color is reserved for status and severity; structure, typography, and whitespace carry the rest.
3. **Ledger as operating memory:** automated and human actions become legible, time-stamped decisions in one continuous place.
4. **Forward-only flow:** interface controls visibly advance or resolve operational states, rather than merely flagging them.

## Color Philosophy

Graphite surfaces provide a neutral, low-fatigue environment for long shifts. Amber is the ownable WMS-9 decision signal: it calls attention to decisions and pending action without automatically implying failure. Green represents a completed resolution; red is strictly reserved for critical exceptions; blue communicates active, in-progress work. Muted blue-grey typography provides supporting context without competing with operational signals.

## Layout Paradigm

The app uses a **rail-and-workbench** format. A fixed narrow navigation rail holds wayfinding and live shift status; the main workbench changes modules. Dashboard content is intentionally asymmetric: a wide operational queue occupies the primary field while the Decision Ledger stays visible as a secondary, event-stream column. Narrow screens collapse the rail into an icon strip and stack the workbench in operational priority order.

## Signature Elements

1. **Decision Ledger:** terminal-style entries with source, time, status point, rationale, and action outcome.
2. **Stage rail:** compact row of fulfilment stages with a live progress line to show where work is accumulating.
3. **Operational tokens:** small rectangular status chips and monospace identifiers that create a warehouse-command vocabulary.

## Interaction Philosophy

Every control has operational consequence. Advance, resolve, quarantine, assign, and quick-chat actions update local state, add a ledger entry, and leave the user at the next decision rather than a dead end. Details open in contextual modal panels; low-risk actions happen inline.

## Animation

Motion is restrained and factual: controls depress briefly on activation, cards receive a short opacity/translate entrance, and newly written ledger lines ease in from the lower edge. All functional transitions sit under 220ms with a crisp custom ease-out. The interface respects reduced-motion preferences.

## Typography System

**Barlow Condensed** is used in large headings, labels, stage names, and metrics for industrial clarity. **Inter** carries readable UI and supporting sentences. **IBM Plex Mono** is reserved for IDs, SKUs, timestamps, quantities, tracking numbers, and ledger evidence. Headings are tightly tracked; operational descriptions retain normal line-height for scanability.

## Brand Essence

**WMS-9 is a decision-first warehouse operations console for teams that need every exception to end in a traceable resolution.**  
**Personality:** decisive, precise, composed.

## Brand Voice

Headlines state the operation and its urgency in direct language. CTAs use verbs paired with concrete outcomes; microcopy explains the system’s reasoning without marketing filler.

> “Two orders need a carrier decision before 16:00.”

> “Quarantine 18 units and protect the next allocation.”

## Wordmark & Logo

The mark is a **stacked nine-grid warehouse cell**: eight muted cells form a compact square while the ninth cell is an amber decision light, suggesting an operational checkpoint. The WMS-9 wordmark is set in Barlow Condensed with a small monospace system descriptor.

## Signature Brand Color

**Decision Amber — #F5A623.**

## Style Decisions

- Active shipment and workflow states use blue; green is reserved for completed or resolved outcomes, amber marks pending decisions, and red marks critical exceptions.
- The public tracking route retains terminal vocabulary through monospace IDs, timestamped evidence, compact status tokens, and a short rationale for the active carrier state.
- Tracking copy names the present operating condition and the next expected outcome rather than using generic consumer-facing filler.
