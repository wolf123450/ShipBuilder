# Phase 1 Manual Test Guide

This guide walks you through manually verifying all Phase 1 features directly in the UI. Each subphase has a series of steps that can be performed independently.

**Estimated time per subphase: 10-15 minutes**

---

## Prerequisites

- App running locally with `npm run dev`
- Preview3D.vue open and canvas rendering
- HullEditor.vue visible for controls
- Console open (F12) to catch any errors

---

## Phase 1.1: Dual Hull Algorithms

### Objective
Verify that you can switch between **Parametric Surface** (smooth, high-quality) and **Voxel Marching Cubes** (fast, blocky) algorithms, and that the UI correctly selects the algorithm.

### Manual Test Steps

1. **Load the default ship**
   - Open the app
   - Verify a ship is displayed in Preview3D.vue
   - Look at the HullEditor panel → find "Generation Algorithm" section
   - ✅ **Expected:** Algorithm is set to "Parametric Surface (Recommended)"

2. **Observe smooth hull geometry**
   - In Preview3D.vue, rotate the camera to inspect the hull surface
   - Look for smooth curves with no visible voxel grid
   - ✅ **Expected:** Hull appears smooth; no blocky/stepped surface

3. **Switch to Voxel algorithm**
   - In HullEditor → "Generation Algorithm" section
   - Click the "Voxel (Fast)" button
   - HullEditor should update and show "Voxel Resolution" slider (instead of spine sample rate)
   - ✅ **Expected:** Button is now highlighted; slider appears

4. **Observe blocky hull geometry**
   - Look at Preview3D.vue hull immediately
   - Inspect edge closely; zoom in on surface
   - Look for visible grid/stepped appearance
   - ✅ **Expected:** Hull looks blocky; voxel grid visible at surface

5. **Verify Voxel Resolution controls work**
   - In HullEditor, adjust "Voxel Resolution" slider (0.1–2.0m)
   - Lower resolution (0.1) = finer grid = smoother appearance
   - Higher resolution (2.0) = coarser grid = blockier appearance
   - Mesh updates in real-time
   - ✅ **Expected:** Hull mesh updates as slider changes

6. **Switch back to Parametric**
   - Click "Parametric Surface (Recommended)" button
   - Canvas updates; hull becomes smooth again
   - Spine Sample Rate slider reappears in HullEditor
   - ✅ **Expected:** Button highlighted; spin sample rate shown; mesh is smooth

7. **Verify no console errors**
   - Open browser console (F12)
   - ✅ **Expected:** No red errors; only info/warnings allowed

---

## Phase 1.2: Superellipse & Shape Parameters

### Objective
Verify that cross-section shapes can be **changed** (ellipse → superellipse → box), and that **shape parameters** (n, m, topBias) visibly affect hull geometry.

### Manual Test Steps

1. **Locate Cross-Section Shape controls**
   - In HullEditor, scroll to "Cross-Section Shape" section
   - Verify three buttons: "Ellipse" / "Superellipse" / "Box"
   - Ellipse should be selected by default
   - ✅ **Expected:** Three buttons visible; Ellipse highlighted

2. **Observe elliptical cross-section**
   - With Ellipse selected, rotate Preview3D.vue to view perpendicular to spine
   - Toggle Preset Views → "Front (Z+)" for clearest view
   - ✅ **Expected:** Cross-section appears as an ellipse (elongated circle)

3. **Switch to Superellipse**
   - Click "Superellipse" button
   - Two sliders appear: "n" and "m" (shape parameters)
   - Both should default to 2.0
   - ✅ **Expected:** Superellipse button highlighted; n/m sliders visible

4. **Adjust Shape Parameter n**
   - With "Front" view active, adjust **n slider** from 2.0 → 8.0
   - Watch hull cross-section in real-time
   - At n=2: appears elliptical
   - At n=4: rounded box
   - At n=8: sharp box-like shape
   - ✅ **Expected:** Smooth transition from pointy → rounded → boxy

5. **Reset n, then adjust m**
   - Reset **n slider** to 2.0
   - Adjust **m slider** from 2.0 → 8.0
   - Vertical cross-section (height) becomes boxy
   - ✅ **Expected:** Top/bottom of hull flatten as m increases

6. **Set both n and m to 8 (box shape)**
   - n = 8, m = 8
   - ✅ **Expected:** Cross-section appears as a box (four flat sides, rounded corners)

7. **Observe Top Bias (Height Asymmetry)**
   - Find "Height Asymmetry (topBias)" slider (0.5–2.0)
   - Default: 1.0 (symmetric)
   - Set to **0.5**
   - ✅ **Expected:** Hull compresses vertically (flattens)

8. **Set topBias to 2.0**
   - ✅ **Expected:** Hull stretches vertically (taller)

9. **Set topBias back to 1.0**
   - ✅ **Expected:** Hull returns to symmetric proportions

10. **Switch to Box shape**
    - Click "Box" button
    - Hull now uses superellipse with n=8, m=8 by default
    - ✅ **Expected:** Box button highlighted; hull appears box-like

11. **Switch back to Ellipse**
    - Click "Ellipse" button
    - Shape controls disappear; hull is round ellipse
    - ✅ **Expected:** Ellipse button highlighted; n/m sliders gone

12. **Verify no console errors**
    - ✅ **Expected:** No red errors

---

## Phase 1.3: Multi-Hull Support & Transforms

### Objective
Verify that you can add **secondary hulls** (e.g., engine pods) with **position/rotation/scale transforms**, and that they appear correctly positioned in 3D space.

### Manual Test Steps

1. **Create a test ship with secondary hull**
   - Edit ship spec to include a secondary hull
   - Add this YAML to your ship spec (in HullEditor or by editing JSON):
   ```yaml
   secondary_hulls:
     - name: "Starboard Engine Pod"
       distribution: "along_spine"
       spine_points:
         - { y: 20, radius: 2.5 }
         - { y: 40, radius: 2.0 }
       world_transform:
         position: { x: 15, y: 0, z: 20 }
         rotation: { x: 0, y: 0, z: 0 }
         scale: 1.0
       generation_algorithm: "parametric_surface"
       has_interior_decks: false
   ```
   - ✅ **Expected:** Ship recompiles without errors

2. **View from Top (Y+)**
   - In Preview3D.vue, click "Top (Y+)" preset view
   - Look for secondary hull pod to the right of primary hull
   - ✅ **Expected:** Pod visible at X≈15; displaced sideways from center

3. **View from Front (Z+)**
   - Click "Front (Z+)" preset view
   - Pod should appear offset forward (positive Z)
   - ✅ **Expected:** Pod visible at Z≈20; forward of center

4. **Modify pod transform: move along X**
   - Change pod `world_transform.position.x` from 15 → -15
   - **Expected:** Pod moves to left side; preview updates instantly

5. **Modify pod transform: move along Y**
   - Change pod `world_transform.position.y` from 0 → 10
   - **Expected:** Pod moves upward

6. **Modify pod transform: add rotation**
   - Add `world_transform.rotation.z: 45` (45° rotation around Z axis)
   - **Expected:** Pod tilts/rotates in 3D space

7. **Modify pod scale**
   - Change `world_transform.scale` from 1.0 → 0.5
   - **Expected:** Pod becomes half-size

8. **Add a second secondary hull (port engine)**
   ```yaml
   secondary_hulls:
     - name: "Starboard Engine Pod"
       # ... as above
     - name: "Port Engine Pod"
       distribution: "along_spine"
       spine_points:
         - { y: 20, radius: 2.5 }
         - { y: 40, radius: 2.0 }
       world_transform:
         position: { x: -15, y: 0, z: 20 }
         rotation: { x: 0, y: 0, z: 0 }
         scale: 1.0
       generation_algorithm: "parametric_surface"
       has_interior_decks: false
   ```
   - ✅ **Expected:** Two pods visible; symmetric around central hull

9. **Rotate 3D view to inspect**
   - Use mouse drag to rotate camera freely
   - Both pods should remain visible and properly positioned
   - ✅ **Expected:** Stable, correct spatial relationships maintained

10. **Verify no console errors**
    - ✅ **Expected:** No red errors

---

## Phase 1.4: Non-Traversible Hulls (hasInteriorDecks)

### Objective
Verify that the **hasInteriorDecks** flag controls whether decks are generated for a hull, allowing engine pods (secondary hulls) to exist without deck grids.

### Manual Test Steps

1. **Verify primary hull has decks by default**
   - With current ship (has primary + secondary pods)
   - Toggle "Mesh Controls" → check "Decks" checkbox
   - View from "Top (Y+)"
   - ✅ **Expected:** Blue grid lines (deck footprints) visible across **primary hull** ONLY

2. **Observe secondary pod has NO decks**
   - Look at secondary hull pod areas
   - ✅ **Expected:** Engine pods appear solid, no blue grid lines inside

3. **Disable decks on primary hull**
   - In HullEditor, find "This hull has interior decks" checkbox
   - **Uncheck** it
   - ✅ **Expected:** Checkbox now unchecked; blue deck grid disappears from entire preview

4. **Re-enable decks**
   - **Check** the "This hull has interior decks" checkbox
   - ✅ **Expected:** Blue deck grid reappears on primary hull

5. **View in 3D (rotate freely)**
   - Decks should only appear within primary hull boundaries
   - Engine pods should be solid (no decks inside)
   - ✅ **Expected:** Correct spatial containment; no visual errors

6. **Toggle Decks visibility OFF**
   - In Mesh Controls, uncheck "Decks"
   - ✅ **Expected:** All blue grid lines disappear

7. **Toggle Decks visibility ON**
   - In Mesh Controls, check "Decks"
   - ✅ **Expected:** Blue grid lines reappear on primary hull only

8. **Verify no console errors**
    - ✅ **Expected:** No red errors

---

## Phase 1 Integration Test: Complete Workflow

### Objective
Run through a complete end-to-end test combining all Phase 1 features.

### Manual Test Steps

1. **Start fresh**
   - Load or create a new ship
   - Algorithm: **Parametric Surface**
   - Shape: **Superellipse (n=4, m=4, topBias=1.2)**

2. **Add two engine pods using Phase 1.3**
   - Port pod: position (-12, 0, 18), scale 0.8, rotation z=0
   - Starboard pod: position (12, 0, 18), scale 0.8, rotation z=0
   - Both with `has_interior_decks: false`

3. **Verify complete layout**
   - View from "Top" → pods symmetric, offset from center
   - View from "Front" → pods forward of center
   - View from "Right" → pods on right side
   - Rotate freely → maintains spatial coherence
   - ✅ **Expected:** All geometric relationships correct

4. **Toggle hull visibility**
   - Uncheck "Hull" in Mesh Controls
   - ✅ **Expected:** Primary hull disappears, pods still visible
   - Check "Hull"
   - ✅ **Expected:** Primary hull reappears

5. **Toggle deck visibility**
   - Uncheck "Decks"
   - ✅ **Expected:** No blue grid lines
   - Check "Decks"
   - ✅ **Expected:** Blue grid appears on primary hull, not on pods

6. **Switch to Voxel algorithm**
   - Algorithm button → "Voxel (Fast)"
   - ✅ **Expected:** Hull becomes blocky; pods still present and positioned correctly

7. **Switch back to Parametric**
   - Algorithm button → "Parametric Surface"
   - ✅ **Expected:** Hull smooths out; pods unchanged

8. **Change shape to Box**
   - Shape button → "Box"
   - ✅ **Expected:** Cross-section visual changes to box-like

9. **Adjust topBias**
   - Set topBias slider → 0.7
   - ✅ **Expected:** Hull flattens vertically

10. **Final 360° view**
    - Rotate camera full rotation
    - ✅ **Expected:** No visual glitches; all geometry stable and coherent

11. **Verify console is clean**
    - Open F12
    - ✅ **Expected:** No red errors; warnings acceptable

---

## Test Results Checklist

Mark off each phase as you complete it:

- [ ] **Phase 1.1 Complete**: Dual algorithms working, switching between parametric/voxel smooth
- [ ] **Phase 1.2 Complete**: Shape parameters responsive, ellipse/superellipse/box visible
- [ ] **Phase 1.3 Complete**: Secondary hulls positioned correctly with transforms
- [ ] **Phase 1.4 Complete**: Deck generation respects hasInteriorDecks flag
- [ ] **Integration Test Complete**: All features work together without conflicts

---

## Troubleshooting

### Issue: Hull doesn't update when changing algorithm
**Solution:** Clear cache (Ctrl+Shift+Delete), reload page (F5), check console for errors

### Issue: Pods not visible in 3D
**Solution:** Check that secondary_hulls array is in ship spec; verify transforms have valid coordinates; try zooming out (scroll wheel)

### Issue: Blue deck lines don't appear or disappear unexpectedly
**Solution:** Toggle "Decks" checkbox in Mesh Controls; verify hasInteriorDecks is not false on primary hull; check HullEditor settings

### Issue: Console shows red errors
**Solution:** Take screenshot of error; this indicates a bug in Phase 1 implementation that needs fixing before proceeding

### Issue: Camera won't focus on pod
**Solution:** Use camera controls to manually set target position; or zoom out to see full scene

---

## Next Steps

Once all Phase 1 subphases pass this manual test:
1. Run automated tests (unit + integration)
2. Commit Phase 1 to git with "verified: manual testing complete" note
3. Proceed to Phase 2 (room shapes)
