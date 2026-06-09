"""
Animation + transition injection for python-pptx.

python-pptx has no native support for animations or slide transitions, so we
build the PresentationML <p:transition> and <p:timing> XML by hand and splice it
into each slide element in the schema-correct position.

CT_Slide child order (matters): cSld, clrMapOvr, transition, timing, extLst.

Entrance effects are emitted as a single click-triggered main sequence whose
children auto-advance ("after previous") unless a step is explicitly marked as a
click. That produces a cinematic, self-building slide without needing clicks,
while still being exactly the node structure PowerPoint itself writes (so files
open clean, no repair prompt).
"""
from pptx.oxml import parse_xml
from pptx.oxml.ns import qn

P = "http://schemas.openxmlformats.org/presentationml/2006/main"

# ---- entrance preset library -------------------------------------------------
# Each preset maps to the behaviour XML PowerPoint emits for that named effect.
# {dur} = duration ms, {spid} = target shape id. We keep behaviours minimal and
# valid; presetID/presetClass drive the label in the Animation Pane.

def _fade(spid, dur):
    return (
        '<p:set><p:cBhvr><p:cTn id="{cid0}" dur="1" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl>'
        '<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        '</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
        '<p:animEffect transition="in" filter="fade">'
        '<p:cBhvr><p:cTn id="{cid1}" dur="%d"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl></p:cBhvr></p:animEffect>'
        % (spid, dur, spid)
    ), dict(presetID="10", presetClass="entr", presetSubtype="0")

def _wipe(spid, dur, direction="up"):
    return (
        '<p:set><p:cBhvr><p:cTn id="{cid0}" dur="1" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl>'
        '<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        '</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
        '<p:animEffect transition="in" filter="wipe(%s)">'
        '<p:cBhvr><p:cTn id="{cid1}" dur="%d"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl></p:cBhvr></p:animEffect>'
        % (spid, direction, dur, spid)
    ), dict(presetID="22", presetClass="entr",
            presetSubtype={"up": "4", "down": "8", "left": "2", "right": "1"}.get(direction, "4"))

def _float_in(spid, dur):
    # Fade + rise: the polished "Float In" look.
    return (
        '<p:set><p:cBhvr><p:cTn id="{cid0}" dur="1" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl>'
        '<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        '</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
        '<p:anim calcmode="lin" valueType="num">'
        '<p:cBhvr additive="base"><p:cTn id="{cid1}" dur="%d" fill="hold"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl>'
        '<p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr>'
        '<p:tavLst><p:tav tm="0"><p:val><p:strVal val="ppt_y+.04"/></p:val></p:tav>'
        '<p:tav tm="100000"><p:val><p:strVal val="ppt_y"/></p:val></p:tav></p:tavLst></p:anim>'
        '<p:animEffect transition="in" filter="fade">'
        '<p:cBhvr><p:cTn id="{cid2}" dur="%d"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl></p:cBhvr></p:animEffect>'
        % (spid, dur, spid, dur, spid)
    ), dict(presetID="42", presetClass="entr", presetSubtype="0")

def _zoom(spid, dur):
    return (
        '<p:set><p:cBhvr><p:cTn id="{cid0}" dur="1" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl>'
        '<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        '</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
        '<p:animEffect transition="in" filter="fade">'
        '<p:cBhvr><p:cTn id="{cid1}" dur="%d"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl></p:cBhvr></p:animEffect>'
        '<p:animScale><p:cBhvr><p:cTn id="{cid2}" dur="%d" fill="hold"/>'
        '<p:tgtEl><p:spTgt spid="%s"/></p:tgtEl></p:cBhvr>'
        '<p:by x="100000" y="100000"/><p:from x="60000" y="60000"/>'
        '<p:to x="100000" y="100000"/></p:animScale>'
        % (spid, dur, spid, dur, spid)
    ), dict(presetID="23", presetClass="entr", presetSubtype="0")

_PRESETS = {
    "fade": _fade,
    "wipe": _wipe,
    "float": _float_in,
    "zoom": _zoom,
}


MC_ALT = "{http://schemas.openxmlformats.org/markup-compatibility/2006}AlternateContent"


def _insert_in_order(sld, new_el, slot_tag=None):
    """Insert transition/timing right after cSld/clrMapOvr, before extLst.

    slot_tag overrides which schema slot the element occupies (a morph
    transition arrives wrapped in mc:AlternateContent but still belongs in the
    p:transition slot)."""
    tag = slot_tag or new_el.tag
    order = [qn("p:cSld"), qn("p:clrMapOvr"), qn("p:transition"),
             qn("p:timing"), qn("p:extLst")]
    # Remove any existing node occupying this slot first (idempotent).
    removable = {tag}
    if tag == qn("p:transition"):
        removable.add(MC_ALT)
    for existing in list(sld):
        if existing.tag in removable:
            sld.remove(existing)
    my_idx = order.index(tag)
    # Find first child whose position is after mine; insert before it.
    insert_before = None
    for child in sld:
        if child.tag in order and order.index(child.tag) > my_idx:
            insert_before = child
            break
    if insert_before is None:
        sld.append(new_el)
    else:
        insert_before.addprevious(new_el)


def add_transition(slide, kind="fade", dur_ms=700, direction="l"):
    """kind: morph | fade | push | wipe | cover | cut."""
    sld = slide._element
    if kind == "morph":
        xml = (
            '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
            '<mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14">'
            '<p:transition xmlns:p="%s" spd="slow" p14:dur="%d"><p14:morph option="byObject"/></p:transition>'
            '</mc:Choice>'
            '<mc:Fallback>'
            '<p:transition xmlns:p="%s" spd="slow"><p:fade/></p:transition>'
            '</mc:Fallback></mc:AlternateContent>' % (P, dur_ms, P)
        )
    else:
        inner = {
            "fade": "<p:fade/>",
            "push": '<p:push dir="%s"/>' % direction,
            "wipe": '<p:wipe dir="%s"/>' % direction,
            "cover": '<p:cover dir="%s"/>' % direction,
            "cut": "<p:cut/>",
        }.get(kind, "<p:fade/>")
        xml = ('<p:transition xmlns:p="%s" spd="slow">%s</p:transition>' % (P, inner))
    _insert_in_order(sld, parse_xml(xml), slot_tag=qn("p:transition"))


def add_entrance(slide, effects):
    """effects: ordered list of dicts:
        {shape, type, dur, delay, trigger}
      shape   : a pptx shape (must have a shape id)
      type    : fade | wipe | float | zoom
      dur     : ms (default 600)
      delay   : ms before this effect (default 0; for after_previous spacing)
      trigger : 'click' (wait for click) | 'after' (auto after prev) |
                'with' (simultaneously with prev)
    The first effect defaults to 'click' so the slide starts on advance.
    """
    if not effects:
        return
    cid = [100]  # mutable id counter, kept well clear of layout ids

    def nid():
        cid[0] += 1
        return cid[0]

    effect_pars = []
    for i, e in enumerate(effects):
        shape = e["shape"]
        spid = shape.shape_id
        etype = e.get("type", "fade")
        dur = int(e.get("dur", 600))
        delay = int(e.get("delay", 0))
        trigger = e.get("trigger", "click" if i == 0 else "after")
        node_type = {"click": "clickEffect", "after": "afterEffect",
                     "with": "withEffect"}[trigger]

        beh_tmpl, meta = _PRESETS[etype](spid, dur)
        # fill behaviour ids
        ids = {f"cid{k}": nid() for k in range(3)}
        behaviours = beh_tmpl.format(**ids)
        leaf_id = nid()
        mid_id = nid()
        delay_str = "indefinite" if trigger == "click" else str(delay)
        effect_pars.append(
            '<p:par><p:cTn id="%d" fill="hold">'
            '<p:stCondLst><p:cond delay="%s"/></p:stCondLst>'
            '<p:childTnLst>'
            '<p:par><p:cTn id="%d" presetID="%s" presetClass="%s" presetSubtype="%s" '
            'fill="hold" grpId="0" nodeType="%s">'
            '<p:stCondLst><p:cond delay="0"/></p:stCondLst>'
            '<p:childTnLst>%s</p:childTnLst>'
            '</p:cTn></p:par>'
            '</p:childTnLst></p:cTn></p:par>'
            % (mid_id, delay_str,
               leaf_id, meta["presetID"], meta["presetClass"],
               meta["presetSubtype"], node_type, behaviours)
        )

    # The mid-level cond delay must be the string "indefinite" for click steps.
    # Re-emit click steps with the literal (above we passed an int for delay).
    timing_xml = (
        '<p:timing xmlns:p="%s"><p:tnLst>'
        '<p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">'
        '<p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek">'
        '<p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>%s</p:childTnLst></p:cTn>'
        '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
        '</p:seq></p:childTnLst></p:cTn></p:par>'
        '</p:tnLst></p:timing>' % (P, "".join(effect_pars))
    )
    _insert_in_order(slide._element, parse_xml(timing_xml))
