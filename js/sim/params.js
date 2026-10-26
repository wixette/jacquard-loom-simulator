// The machine's numbers, read once from params/machine.json (the single source of truth:
// every value there carries its source and confidence). This module flattens them to the
// plain numbers the simulation and the views use.

import data from "../../params/machine.json" with { type: "json" };

/**
 * @typedef {{ v: number, unit: string, conf: string, src: string, note?: string }} Num
 * @typedef {{ v: [number, number], unit: string, conf: string, src: string, note?: string }} Span
 */

/** The parameter file as it is, for anything that wants a value's source. */
export const PARAMS = data;

/** Lengths in mm; cycle windows as [start, end] fractions of one pick. */
export const P = {
  rows: data.head.rows.v,
  bottomBoardThickness: data.head.bottom_board_thickness.v,
  needleBoardThickness: data.head.needle_board_thickness.v,
  needleBoardHeight: data.head.needle_board_height.v,

  hookHeight: data.hooks.height.v,
  resterHeight: data.hooks.rester_height.v,
  hookWire: data.hooks.wire_diameter.v,
  hookPitch: data.hooks.pitch_across_knives.v,
  firstHookX: data.hooks.first_from_needle_board.v,
  crookOverhang: data.hooks.crook_overhang.v,
  crookTipDrop: data.hooks.crook_tip_drop.v,

  needleLength: data.needles.length.v,
  needleHeadToLoop: data.needles.head_to_loop.v,
  needleEye: data.needles.eye_length.v,
  needleWire: data.needles.wire_diameter.v,
  needleProtrusion: data.needles.protrusion.v,
  tierPitch: data.needles.tier_pitch.v,
  topTierY: data.needles.top_tier_height.v,

  springBoxInner: data.springs.box_inner_face.v,
  springBoxBack: data.springs.box_back.v,
  springCoil: data.springs.coil_diameter.v,

  knifeHeight: data.griffe.knife_height.v,
  knifeThickness: data.griffe.knife_thickness.v,
  knifeGap: data.griffe.knife_to_hook_gap.v,
  restGap: data.griffe.rest_gap_under_crook.v,
  griffeLift: data.griffe.lift.v,

  cylinderFace: data.cylinder.face.v,
  cylinderTravel: data.cylinder.travel_out.v,
  cardThickness: data.cylinder.card_thickness.v,
  cardWidth: data.cylinder.card_width.v,
  holeDiameter: data.cylinder.hole_diameter.v,

  drawnCordLength: data.harness.drawn_cord_length.v,
  drawnMailDrop: data.harness.drawn_mail_drop.v,
  comberThickness: data.harness.comber_board_thickness.v,
  lingoLength: data.harness.lingo_length.v,

  griffeRise: /** @type {[number, number]} */ (data.cycle.griffe_rise.v),
  griffeFall: /** @type {[number, number]} */ (data.cycle.griffe_fall.v),
  cylinderOut: /** @type {[number, number]} */ (data.cycle.cylinder_out.v),
  cylinderTurn: /** @type {[number, number]} */ (data.cycle.cylinder_turn.v),
  cylinderBack: /** @type {[number, number]} */ (data.cycle.cylinder_back.v),
  cardPress: /** @type {[number, number]} */ (data.cycle.card_press.v),
  shuttle: /** @type {[number, number]} */ (data.cycle.shuttle.v),
  beat: /** @type {[number, number]} */ (data.cycle.beat.v),
  stops: data.cycle.stops.v,
};

/** The machine frame of the 3D models and the 2D side view (mm; see params/machine.json). */
export const FRAME = {
  sectionY: data.machine_frame.section_y.v,
  sectionZ: data.machine_frame.section_z.v,
  warpZ: data.machine_frame.warp_z.v,
  fellY: data.machine_frame.fell_y.v,
  backRestY: data.machine_frame.back_rest_y.v,
  comberZ: data.machine_frame.comber_z.v,
  knotZ: data.machine_frame.harness_knot_z.v,
  repeatSpacing: data.machine_frame.repeat_spacing.v,
  postsY: /** @type {[number, number]} */ (data.machine_frame.frame_posts_y.v),
  frameWidth: data.machine_frame.frame_width.v,
  frameHeight: data.machine_frame.frame_height.v,
  warpWidth: data.machine_frame.warp_width.v,
};

/** Sizes of the parts that the side view and the 3D units share (mm). */
export const U = {
  sliceDepth: data.units3d.slice_depth.v,
  knifeLength: data.units3d.knife_length.v,
  prismLength: data.units3d.prism_length.v,
  lanternHalf: data.units3d.lantern_half.v,
  pegDiameter: data.units3d.peg_diameter.v,
  hammerArm: data.units3d.hammer_arm.v,
  leverPivot: /** @type {[number, number]} */ (data.units3d.lever_pivot.v),
  leverArm: data.units3d.lever_arm.v,
  treadlePivot: /** @type {[number, number]} */ (data.units3d.treadle_pivot.v),
  treadleCord: /** @type {[number, number]} */ (data.units3d.treadle_cord.v),
  treadleFootY: data.units3d.treadle_foot_y.v,
  battenPivot: /** @type {[number, number]} */ (data.units3d.batten_pivot.v),
  reedRestY: data.units3d.reed_rest_y.v,
  reedBackY: data.units3d.reed_back_y.v,
  shuttle: /** @type {[number, number, number]} */ (data.units3d.shuttle.v),
  shuttleTravel: /** @type {[number, number]} */ (data.units3d.shuttle_travel.v),
};
