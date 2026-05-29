// aura_warp — hand-warped body aura for the CBL TouchDesigner network.
//
// Target: glslTOP, 1280x720, inside /project1/cbl.
// Built/loaded by td/resume_build.py (build_aura()).
//
// A soft radial glow centred on the torso, domain-warped toward each hand,
// tinted by chakra hue and brightened on each heartbeat. This is the
// "hand-warped body aura" from docs/touchdesigner-handoff-2026-05-26.md §5 Step 2.
//
// COORDINATES (do NOT re-derive — baked to match the particle sim):
//   All pose UVs arrive 0..1 with v already y-up (pose_ws_cb flips v = 1 - y).
//   Centred world space for the 16:9 ortho camera:
//       worldX = u - 0.5
//       worldY = (v - 0.5) * 0.5625      // 0.5625 = 720 / 1280
//   Do NOT flip Y again here.
//
// UNIFORMS (packed; bound by resume_build.py via the vecNname / vecNvaluex
//           expression pattern that cymatics/aurora already use):
//   uHands  : xy = left wrist (u,v) ; zw = right wrist (u,v)   [0..1 UV]
//   uSpeeds : x  = left wrist speed ; y = right wrist speed     [uv/sec]
//   uMisc   : xy = torso (u,v) ; z = chakra hue (0..1) ; w = heartbeat beat (0..1)

uniform vec4 uHands;
uniform vec4 uSpeeds;
uniform vec4 uMisc;

out vec4 fragColor;

const float ASPECT = 0.5625; // 720 / 1280

vec2 toWorld(vec2 uv) {
    return vec2(uv.x - 0.5, (uv.y - 0.5) * ASPECT);
}

// Pull surrounding space toward a hand; the pull grows with hand speed so a
// fast sweep visibly drags the aura, while a still hand barely bends it.
vec2 warpField(vec2 p, vec2 hand, float speed) {
    vec2 d = hand - p;
    float dist = length(d) + 1e-3;
    float pull = (0.06 + speed * 0.25) * exp(-dist * 6.0);
    return normalize(d) * pull;
}

void main() {
    vec2 uv = vUV.st;
    vec2 p  = toWorld(uv);

    vec2 lHand = toWorld(uHands.xy);
    vec2 rHand = toWorld(uHands.zw);
    vec2 torso = toWorld(uMisc.xy);

    // Domain warp the sampling point toward both hands.
    vec2 warped = p
                + warpField(p, lHand, uSpeeds.x)
                + warpField(p, rHand, uSpeeds.y);

    // Soft torso aura in warped space.
    float d    = length(warped - torso);
    float aura = smoothstep(0.38, 0.0, d);

    // Add a brighter halo around each hand.
    aura += smoothstep(0.14, 0.0, length(warped - lHand)) * 0.6;
    aura += smoothstep(0.14, 0.0, length(warped - rHand)) * 0.6;
    aura  = clamp(aura, 0.0, 1.0);

    float hue  = uMisc.z;
    float beat = uMisc.w;

    vec3 color = TDHSVToRGB(vec3(hue, 0.7, aura));
    color *= 1.0 + beat * 0.4; // pulse with the heartbeat

    fragColor = TDOutputSwizzle(vec4(color, aura * 0.6));
}
