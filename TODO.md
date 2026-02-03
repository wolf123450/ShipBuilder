# Ship Design Toolkit - MVP Development Roadmap

## Critical Path to MVP

### Phase 1: Core Visualization (Hull + Decks)
Essential for MVP - users must see visual feedback on their designs.

- [ ] **1.1 Mesh Baker Module**
  - Implement basic mesh generation from hull SDF
  - Convert hull volume to Three.js BufferGeometry
  - Support adaptive resolution for performance
  - Target: ~30 minutes

- [ ] **1.2 Rewrite Preview3D Component**
  - Display hull mesh with lighting
  - Show deck footprints as semi-transparent overlay planes
  - Implement camera controls (orbit, zoom, pan)
  - Add real-time updates on state changes
  - Target: ~45 minutes

- [ ] **1.3 Refactor ShipEditor to Tab-Based Workflow**
  - Replace flat editor with step-by-step tabs
  - **Step 1: Hull Design** — spine profile editor + 3D preview
  - **Step 2: Decks** — height/range controls + footprint visualization
  - **Step 3: Rooms** — room list editor (placeholder for full UI)
  - **Step 4: Export** — download buttons
  - Target: ~1 hour

### Phase 2: Room Placement UI
Enables core design workflow.

- [ ] **2.1 Room Placement Editor**
  - 2D deck view showing footprint polygon
  - Visual room placement (drag-and-drop or parameter controls)
  - Show room overlaps/conflicts
  - Target: ~1 hour

- [ ] **2.2 Room Visualization in 3D**
  - Render rooms as boxes on deck
  - Color-code by type (command, crew, cargo, etc.)
  - Highlight selected room
  - Target: ~30 minutes

### Phase 3: Export & Polish
Makes designs usable.

- [ ] **3.1 GLB/GLTF Mesh Export**
  - Combine hull + deck + room geometry
  - Export as GLB with proper materials
  - Target: ~1 hour

- [ ] **3.2 JSON/YAML Export**
  - Already partially implemented
  - Add download UI button
  - Target: ~15 minutes

- [ ] **3.3 Import from File**
  - File input dialog
  - Parse JSON/YAML
  - Validate and load
  - Target: ~30 minutes

- [ ] **3.4 Persistent Storage**
  - Save to localStorage
  - Load last project on startup
  - Target: ~20 minutes

### Phase 4: Polish & Testing
Make it feel like a real tool.

- [ ] **4.1 Validation & Error Feedback**
  - Show validation errors in UI
  - Prevent invalid configurations
  - Target: ~30 minutes

- [ ] **4.2 Visual Feedback**
  - Loading states
  - Success messages
  - Error notifications
  - Target: ~30 minutes

- [ ] **4.3 Performance Optimization**
  - Profile 3D rendering
  - Optimize mesh generation
  - Target: ~30 minutes

- [ ] **4.4 End-to-End Testing**
  - Design a ship end-to-end
  - Export and verify
  - Test on multiple ships
  - Target: ~30 minutes

## Implementation Order

1. **Start:** Phase 1.1 (Mesh Baker)
2. **Next:** Phase 1.2 (Preview3D rewrite)
3. **Next:** Phase 1.3 (Tab-based UI)
4. **Test:** Build a ship end-to-end, get feedback
5. **Then:** Phase 2 (Room placement)
6. **Polish:** Phase 3 & 4

## Estimated Total Time
- Phase 1: ~2.5 hours
- Phase 2: ~1.5 hours
- Phase 3: ~2 hours
- Phase 4: ~2 hours
- **Total: ~8 hours for full MVP**

## Success Criteria

- [ ] User can design hull with visual feedback
- [ ] User can configure deck layout
- [ ] User can place rooms and see conflicts
- [ ] User can export design as JSON/YAML
- [ ] User can export design as GLB
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] README + QUICK_START up to date

## Notes

- Keep compiler logic pure and testable
- All visual updates should be driven by Pinia store
- Use Three.js for 3D; avoid DOM for geometry
- Mesh generation can be simple at first (improve later)
- Focus on UX clarity over visual polish
