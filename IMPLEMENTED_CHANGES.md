# Implemented Changes

This package includes the requested SolFarm frontend update:

1. Renamed visible SolCraft branding and metadata to SolFarm.
2. Removed town mint controls and prevented the mint modal from opening in town.
3. Added a clear `WELCOME TO TOWN` indicator.
4. Added `Back to Farm` controls in the town HUD and player panel.
5. Added farm ambience, town ambience, movement, travel, and building sounds.
6. Added four required character choices to the create-farm flow.
7. Saved and rendered the selected character choice.
8. Changed building placement to a visible Build button that places the selected
   object exactly on the player's current compatible tile.
9. Added portable Vite configuration and developer setup documentation.
10. Integrated Claude's handcrafted town redesign:
    - fixed dense town layout with civic, market, garden, animal, and dock zones
    - redesigned town hall, bakery, dairy, fruit market, vegetable market,
      games stall, dock, fountain, garden, chicken, sheep, and horse PNGs
    - town-aware minimap with building and player markers
    - shared read-only town world used by the renderer and minimap
11. Reworked only the home farm using the professional farm prototype:
    - professional Plant, Water, Harvest, and Build control panel
    - seven crops with individual seed costs, growth times, sale values, and XP
    - one-tile crop plots, growth progress, watering acceleration, and harvest payouts
    - farmer professions with growth, construction, trade, or XP bonuses
    - farm level progress, crop readiness counts, harvest count, and farm score
    - town rendering, town travel, marketplace, social systems, and landing page preserved
12. New players now receive a completely flat, empty 32x32 grass farm:
    - no premade farmhouse, paths, fields, animals, trees, rocks, tower, or mine
    - every tile starts clear and buildable
    - farmhouse placement is manual instead of automatic
    - existing saved farms are preserved
13. Prototype farm reset release:
    - legacy local farm saves are cleared once per browser
    - old cloud snapshots are not automatically restored
    - every player restarts onboarding on the new empty farm
    - new local and backend saves continue normally after reset
# Professional UI + Supabase multiplayer

- Removed the unused desktop/right statistics drawer.
- Rebuilt the responsive shell for desktop, tablet, and mobile.
- Added larger touch targets and a collapsible mobile farm control sheet.
- Added Supabase anonymous identity, RLS-backed cloud farm saves, profiles, and global chat.
- Added Supabase Realtime Presence/Broadcast for online counts, town movement, and live player avatars.
- Added remote player character tinting and display names in town.
- Added `supabase/schema.sql` and secure setup documentation.
- Kept all secret/service-role credentials out of browser code.
