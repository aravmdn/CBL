// reveal — let the person show through ALL the effects over their body.
//
// Target: glslTOP at the tail of the composite, just before master_level.
//
// WHY: the flowing-ink (flow), sand and aura layers are all composited OVER the
// sharp camera, so the person gets painted over and disappears. Dimming any one
// layer isn't enough. This blends the clean camera-person back in, masked by the
// body segmentation matte, so the effects stay full-strength in the surrounding
// space but go translucent over the body and the user can see themselves.
//
// INPUTS:
//   sTD2DInputs[0] = comp_tips   (the fully-composited effects)
//   sTD2DInputs[1] = comp_cam    (camera over void = sharp person on black)
//   sTD2DInputs[2] = mask_blur   (person matte, 0 bg .. 1 body; display-aligned)
//
// UNIFORM:
//   uReveal.x = how strongly the person shows through over the body (0..1).
//               0 -> pure effects (original look); 1 -> full camera over the body.

uniform vec4 uReveal;

out vec4 fragColor;

void main() {
    vec2 uv = vUV.st;
    vec4 fx  = texture(sTD2DInputs[0], uv);   // effects
    vec4 cam = texture(sTD2DInputs[1], uv);   // sharp person
    float person = texture(sTD2DInputs[2], uv).r;

    float a = clamp(person * uReveal.x, 0.0, 1.0);
    vec3 col = mix(fx.rgb, cam.rgb, a);

    fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
