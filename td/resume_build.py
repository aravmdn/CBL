# CBL TouchDesigner — resume builder (prepared 2026-05-27, offline).
#
# ============================================================================
# STATUS: APPLIED 2026-05-27 (third session, post-reboot). Feature is BUILT,
# composited, and saved to td/cbl_hands_wip.toe. See the "RESOLVED" section in
# docs/touchdesigner-resume-2026-05-27.md. Three things the original (untested)
# functions below got wrong — corrected here for an accurate record:
#   1. THE render bug root cause = p_geo.par.instancing was False (master
#      instancing toggle). instanceactive=1 is a DIFFERENT, per-set flag.
#   2. choptoSOP has NO wired CHOP input — feed it via the `chop` PARAMETER,
#      and map channels->position with chanscope/attscope (NOT a rename op;
#      TD sanitizes channel name "P(0)" to "P_0_" so the rename trick fails).
#   3. op.TDAPI.CreateOp threw tdError after creating ops on this build; raw
#      parent.create(opType, name) was used instead and worked.
# fix_particles()/build_aura() below are updated to the working approach.
# ============================================================================
#
# WHY THIS FILE EXISTS
#   TouchDesigner would not boot on this machine (deterministic GPU init hang:
#   stuck at ~348MB RAM, no window, MCP port 44444 never opens). The fix is a
#   laptop REBOOT, which ends the Claude Code session too. So the remaining
#   particle/aura work is captured here as ready-to-run functions for the fresh
#   post-reboot session to execute over the MCP (td_execute) one step at a time.
#
#   Resume target file: td/cbl_hands_wip.toe   (NOT cbl.toe — that lacks particles)
#   Full context:       docs/touchdesigner-resume-2026-05-27.md
#                       docs/touchdesigner-handoff-2026-05-26.md
#
# HOW TO USE (post-reboot, TD healthy + MCP responding)
#   Run ONE function per td_execute call, and CHECK ERRORS IN A SEPARATE CALL
#   after each (TD caches errors at frame boundaries). Order:
#       1. diagnose()          # ground truth before touching anything
#       2. fix_particles()     # THE render bug — verify a cluster appears at the hands
#       3. build_aura()        # aura_warp glslTOP
#       4. composite()         # wire particles + aura into the master chain
#   Then save via the steps in docs (disable live audio, delete cbl.toe, project.save).
#
# RULES BAKED IN (from docs/touchdesigner-mcp.md "Key Coding Rules")
#   - op.TDAPI.CreateOp / CreateGeometryComp, never raw .create()
#   - Verify unfamiliar param names with op.TDAPI.GetParameterList('typeName')
#   - Check errors in a SECOND, separate td_execute call
#   - These functions are UNTESTED (TD was down when written). If a param name is
#     rejected, GetParameterList the op type and adjust — the structure is right,
#     individual param tokens may need a nudge across TD versions.

CBL = '/project1/cbl'
AURA_FRAG_PATH = 'C:/projects/CBL/td/aura_warp.frag'


def _cbl():
    c = op(CBL)
    if c is None:
        raise RuntimeError(CBL + ' not found — open td/cbl_hands_wip.toe first.')
    return c


def _need(name):
    o = op(CBL + '/' + name)
    if o is None:
        raise RuntimeError('expected op missing: ' + CBL + '/' + name)
    return o


# ---------------------------------------------------------------------------
# 0. DIAGNOSE — print ground truth. Run this first; it changes nothing.
# ---------------------------------------------------------------------------
def diagnose():
    cbl = _cbl()
    print('--- ops in', CBL, '---')
    for o in sorted(cbl.children, key=lambda x: x.name):
        print('  ', o.name, '(' + o.OPType + ')')

    geo = op(CBL + '/p_geo')
    if geo:
        print('--- p_geo instancing params ---')
        for p in ('instanceactive', 'instanceop', 'instancetx', 'instancety',
                  'instancetz', 'instancecountmode', 'numinstances'):
            par = getattr(geo.par, p, None)
            print('   p_geo.par.%s =' % p, (par.eval() if par is not None else '<no such par>'))

    chop = op(CBL + '/p_chop')
    if chop:
        print('--- p_chop ---  numChans=%d numSamples=%d' %
              (chop.numChans, chop.numSamples))
        print('   channels:', [c.name for c in chop.chans])
        if chop.numChans and chop.numSamples:
            print('   r[0]=', chop['r'][0] if 'r' in [c.name for c in chop.chans] else 'n/a')


# ---------------------------------------------------------------------------
# 1. FIX PARTICLES — instance from a SOP (robust path). docs resume §3.
#    Builds: p_chop -> p_rename (r,g,b -> P(0),P(1),P(2)) -> p_ctsop (choptoSOP)
#    then points p_geo.instanceop at p_ctsop using P(0/1/2) as translate.
# ---------------------------------------------------------------------------
def fix_particles():
    cbl = _cbl()
    chop = _need('p_chop')      # toptoCHOP: channels r,g,b,a x 2048 samples
    geo  = _need('p_geo')       # geometryCOMP already built last session

    # CHOP -> SOP: one point per sample (2048). choptoSOP has NO wired input —
    # feed the CHOP via its `chop` PARAMETER, and map the r,g channels into the
    # position attribute via chanscope/attscope (do NOT use a renameCHOP: TD
    # sanitizes the channel name "P(0)" to "P_0_", so the rename trick fails).
    cts = op(CBL + '/p_ctsop')
    if cts is None:
        cts = cbl.create(choptoSOP, 'p_ctsop')
        cts.nodeX, cts.nodeY = -120, -200
    cts.par.chop = chop
    cts.par.chanscope = 'r g'             # r=posX, g=posY (b,a are velocity)
    cts.par.attscope = 'P(0) P(1)'        # -> point position x,y ; Z stays 0
    cts.par.mapping = 'onetoone'
    cts.cook(force=True)

    # point the geometry COMP at the SOP and translate per-point by P.
    # CRITICAL: enable the MASTER instancing toggle — this was the render bug.
    geo.par.instancing = True             # <-- the switch the prior session missed
    geo.par.instanceop = cts
    geo.par.instancetx = 'P(0)'
    geo.par.instancety = 'P(1)'
    geo.par.instancetz = ''
    geo.par.instancecountmode = 'oplength'  # follow the SOP point count (2048)
    geo.cook(force=True)
    print('fix_particles: SOP-instancing wired (p_chop->p_ctsop->p_geo), instancing ON.')
    print('  VERIFY: view p_render — two clusters at the hand x-bands (~320-400 and')
    print('  ~840-960), NOT stacked at center. Sample p_render to confirm.')


# ---------------------------------------------------------------------------
# 2. BUILD AURA — aura_warp glslTOP (1280x720). handoff §5 Step 2.
#    Uniforms bound via vecNname / vecNvaluex expressions reading pose/audio/beat.
# ---------------------------------------------------------------------------
def build_aura():
    cbl = _cbl()
    _need('pose')         # nullCHOP with lWrist_*/rWrist_*/torso_* channels
    # audio_out + heartbeat are expected in cbl; expressions degrade gracefully.

    with open(AURA_FRAG_PATH, 'r') as f:
        frag = f.read()

    dat = op(CBL + '/aura_warp_frag')
    if dat is None:
        dat = cbl.create(textDAT, 'aura_warp_frag')   # CreateOp threw tdError here
        dat.nodeX, dat.nodeY = 600, -200
    dat.text = frag

    glsl = op(CBL + '/aura_warp')
    if glsl is None:
        glsl = cbl.create(glslTOP, 'aura_warp')
        glsl.nodeX, glsl.nodeY = 820, -200
    glsl.par.pixeldat = dat
    # fixed 1280x720 output (matches cymatics/aurora)
    glsl.par.outputresolution = 'custom'
    glsl.par.resolutionw = 1280
    glsl.par.resolutionh = 720

    # --- bind packed uniforms via expressions (vecNname / vecNvaluex) ---
    # uHands : L wrist (u,v) , R wrist (u,v)
    glsl.par.vec0name = 'uHands'
    glsl.par.vec0valuex.expr = "op('pose')['lWrist_u']"
    glsl.par.vec0valuey.expr = "op('pose')['lWrist_v']"
    glsl.par.vec0valuez.expr = "op('pose')['rWrist_u']"
    glsl.par.vec0valuew.expr = "op('pose')['rWrist_v']"
    # uSpeeds : L speed , R speed
    glsl.par.vec1name = 'uSpeeds'
    glsl.par.vec1valuex.expr = "op('pose')['lWrist_spd']"
    glsl.par.vec1valuey.expr = "op('pose')['rWrist_spd']"
    # uMisc : torso (u,v) , hue , beat
    glsl.par.vec2name = 'uMisc'
    glsl.par.vec2valuex.expr = "op('pose')['torso_u']"
    glsl.par.vec2valuey.expr = "op('pose')['torso_v']"
    glsl.par.vec2valuez.expr = "op('audio_out')['hue'] if op('audio_out') else 0.13"
    glsl.par.vec2valuew.expr = "op('heartbeat')['beat'] if op('heartbeat') else 0.0"

    glsl.cook(force=True)
    print('build_aura: aura_warp glslTOP created and uniforms bound.')
    print('  VERIFY: view aura_warp — a soft tinted glow centred on the torso,')
    print('  bending toward your hands as you move them.')


# ---------------------------------------------------------------------------
# 3. COMPOSITE — fold particles + aura into the master chain. handoff §5 Step 3.
#    comp_aur -> comp_bloom(add, +particles) -> comp_aura(screen, +aura_warp) -> master_level
# ---------------------------------------------------------------------------
def composite():
    cbl = _cbl()
    comp_aur     = _need('comp_aur')
    master_level = _need('master_level')

    # particle output: prefer bloom_out null if it exists, else the renderTOP
    particles = op(CBL + '/bloom_out') or op(CBL + '/p_render')
    if particles is None:
        raise RuntimeError('no particle output (bloom_out / p_render) found.')
    aura = _need('aura_warp')

    comp_bloom = op(CBL + '/comp_bloom')
    if comp_bloom is None:
        comp_bloom = cbl.create(compositeTOP, 'comp_bloom')
        comp_bloom.nodeX, comp_bloom.nodeY = 400, 200
    comp_bloom.inputConnectors[0].connect(comp_aur)
    comp_bloom.inputConnectors[1].connect(particles)
    comp_bloom.par.operand = 'add'

    comp_aura = op(CBL + '/comp_aura')
    if comp_aura is None:
        comp_aura = cbl.create(compositeTOP, 'comp_aura')
        comp_aura.nodeX, comp_aura.nodeY = 600, 200
    comp_aura.inputConnectors[0].connect(comp_bloom)
    comp_aura.inputConnectors[1].connect(aura)
    comp_aura.par.operand = 'screen'

    # re-route master_level input from comp_aur -> comp_aura
    master_level.inputConnectors[0].connect(comp_aura)
    print('composite: comp_aur -> comp_bloom(add) -> comp_aura(screen) -> master_level wired.')
    print('  VERIFY: view master_out for the full composite.')


if __name__ == '__main__':
    print('CBL resume builder loaded. Run, in separate td_execute calls, checking')
    print('errors after each:  diagnose() -> fix_particles() -> build_aura() -> composite()')
    print('Then save: disable live audio, delete td/cbl.toe, project.save(...).')
