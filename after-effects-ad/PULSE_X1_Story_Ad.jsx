//@target aftereffects
/*
 ============================================================================
  PULSE X1 - Κινούμενη διαφήμιση Instagram Story (1080x1920, 30fps, 32 sec)
  Προϊόν: PULSE X1 - έξυπνο ρολόι (φανταστικό προϊόν για εκπαιδευτική άσκηση)

  ΟΔΗΓΙΕΣ:  After Effects > File > Scripts > Run Script File...  > επιλέξτε αυτό το αρχείο
  (ο φάκελος assets/ με το pulse_soundtrack.wav πρέπει να βρίσκεται δίπλα στο script)
 ============================================================================
*/
(function () {

    // ------------------------------------------------------------------ ρυθμίσεις
    var W = 1080, H = 1920, FPS = 30, DUR = 32;

    var cBG    = [0.03, 0.04, 0.10, 1];
    var cNAVY  = [0.07, 0.09, 0.22, 1];
    var cCYAN  = [0.10, 0.85, 1.00, 1];
    var cMAG   = [1.00, 0.18, 0.55, 1];
    var cLIME  = [0.72, 1.00, 0.22, 1];
    var cWHITE = [1, 1, 1, 1];
    var cCARD  = [0.08, 0.10, 0.21, 1];
    var cGREY  = [0.70, 0.75, 0.90, 1];

    var FONT_B = "Arial-BoldMT";
    var FONT_R = "ArialMT";

    var MN = {
        anchor: "ADBE Anchor Point", pos: "ADBE Position", scale: "ADBE Scale",
        rot: "ADBE Rotate Z", op: "ADBE Opacity", rx: "ADBE Rotate X", ry: "ADBE Rotate Y"
    };

    var proj, folder, main, scriptFolder;

    // ------------------------------------------------------------------ βοηθητικές
    function rgb(c) { return [c[0], c[1], c[2]]; }

    var seed = 20241127;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }

    function tr(l, k) { return l.property("ADBE Transform Group").property(MN[k]); }

    // easy ease σε όλα τα keyframes μιας ιδιότητας
    function ease(prop, infl) {
        var t = prop.propertyValueType, d = 1;
        if (t === PropertyValueType.TwoD) d = 2;
        else if (t === PropertyValueType.ThreeD) d = 3;
        else if (t === PropertyValueType.COLOR) d = 4;
        var e = [];
        for (var j = 0; j < d; j++) e.push(new KeyframeEase(0, infl));
        for (var i = 1; i <= prop.numKeys; i++) {
            try { prop.setTemporalEaseAtKey(i, e, e); } catch (err) {}
        }
    }

    function key(prop, times, vals, infl) {
        for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], vals[i]);
        ease(prop, infl === undefined ? 75 : infl);
        return prop;
    }

    function span(l, a, b) { l.outPoint = b; l.inPoint = a; return l; }
    function sc(l, n) { return l.threeDLayer ? [n, n, n] : [n, n]; }
    function posv(l, x, y, z) { return l.threeDLayer ? [x, y, (z || 0)] : [x, y]; }
    function setPos(l, x, y, z) { tr(l, "pos").setValue(posv(l, x, y, z)); }
    function fade(l, t0, t1, a, b) { return key(tr(l, "op"), [t0, t1], [a, b], 60); }

    // expression "inertial bounce" (ελατήριο) για position / scale
    function bounce(amp, freq, decay) {
        return "var amp=" + amp + ", freq=" + freq + ", decay=" + decay + ";\n" +
            "var n=0;\n" +
            "if (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }\n" +
            "if (n>0){ var t=time-key(n).time; var v=velocityAtTime(key(n).time-thisComp.frameDuration/10);\n" +
            "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else { value; }";
    }
    var BOUNCE_S = bounce(0.05, 2.6, 4.5);
    var BOUNCE_P = bounce(0.02, 2.2, 5);
    // παλμός στο beat των 120 BPM (2 παλμοί το δευτερόλεπτο)
    var BEAT = "Math.pow(Math.abs(Math.cos(time*Math.PI*2)),10)";

    // ------------------------------------------------------------------ εφέ
    function addFx(l, match, name) {
        var e = l.property("ADBE Effect Parade").addProperty(match);
        if (name) e.name = name;
        return e;
    }
    function setP(e, idx, v) { try { e.property(idx).setValue(v); } catch (err) {} }
    function glow(l, radius, intensity) {
        var e = addFx(l, "ADBE Glow", "Glow");
        setP(e, 3, radius); setP(e, 4, intensity);
        return e;
    }
    function slider(l, name) { var e = addFx(l, "ADBE Slider Control", name); return e.property(1); }

    // ------------------------------------------------------------------ shape layers
    function shapeLayer(comp, name) { var l = comp.layers.addShape(); l.name = name; return l; }
    function grp(l, name) {
        var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.name = name;
        return g.property("ADBE Vectors Group");
    }
    function addRect(c, w, h, r, pos) {
        var s = c.addProperty("ADBE Vector Shape - Rect");
        s.property("ADBE Vector Rect Size").setValue([w, h]);
        s.property("ADBE Vector Rect Roundness").setValue(r);
        if (pos) s.property("ADBE Vector Rect Position").setValue(pos);
        return s;
    }
    function addEllipse(c, w, h, pos) {
        var s = c.addProperty("ADBE Vector Shape - Ellipse");
        s.property("ADBE Vector Ellipse Size").setValue([w, h]);
        if (pos) s.property("ADBE Vector Ellipse Position").setValue(pos);
        return s;
    }
    function addPath(c, verts, closed) {
        var s = c.addProperty("ADBE Vector Shape - Group");
        var sh = new Shape();
        var z = [];
        for (var i = 0; i < verts.length; i++) z.push([0, 0]);
        sh.vertices = verts; sh.inTangents = z; sh.outTangents = z; sh.closed = !!closed;
        s.property("ADBE Vector Shape").setValue(sh);
        return s;
    }
    function addStar(c, pts, outer, inner) {
        var s = c.addProperty("ADBE Vector Shape - Star");
        try {
            s.property("ADBE Vector Star Type").setValue(1);
            s.property("ADBE Vector Star Points").setValue(pts);
            s.property("ADBE Vector Star Outer Radius").setValue(outer);
            s.property("ADBE Vector Star Inner Radius").setValue(inner);
        } catch (err) {}
        return s;
    }
    function addFill(c, col) {
        var f = c.addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(col);
        return f;
    }
    function addStroke(c, col, w, round) {
        var s = c.addProperty("ADBE Vector Graphic - Stroke");
        s.property("ADBE Vector Stroke Color").setValue(col);
        s.property("ADBE Vector Stroke Width").setValue(w);
        if (round) {
            try { s.property("ADBE Vector Stroke Line Cap").setValue(2); s.property("ADBE Vector Stroke Line Join").setValue(2); } catch (err) {}
        }
        return s;
    }
    function addTrim(c) { return c.addProperty("ADBE Vector Filter - Trim"); }
    function addRepeater(c, copies, off, rot) {
        var r = c.addProperty("ADBE Vector Filter - Repeater");
        r.property("ADBE Vector Repeater Copies").setValue(copies);
        try {
            var t = r.property("ADBE Vector Repeater Transform");
            if (off) t.property("ADBE Vector Repeater Position").setValue(off);
            if (rot) t.property("ADBE Vector Repeater Rotation").setValue(rot);
        } catch (err) {}
        return r;
    }
    function roundRect(comp, name, w, h, r, fill, stroke, strokeW) {
        var l = shapeLayer(comp, name);
        var g = grp(l, "shape");
        addRect(g, w, h, r);
        if (fill) addFill(g, fill);
        if (stroke) addStroke(g, stroke, strokeW || 4);
        return l;
    }

    // ------------------------------------------------------------------ κείμενο
    function txt(comp, str, size, col, x, y, opt) {
        opt = opt || {};
        var l = comp.layers.addText(str);
        var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
        var td = prop.value;
        td.resetCharStyle();
        td.fontSize = size;
        td.fillColor = rgb(col);
        td.font = opt.font || FONT_B;
        td.applyFill = true;
        td.applyStroke = false;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        if (opt.tracking !== undefined) td.tracking = opt.tracking;
        prop.setValue(td);
        var r = l.sourceRectAtTime(0, false);
        tr(l, "anchor").setValue([r.left + r.width / 2, r.top + r.height / 2]);
        if (opt.threeD) l.threeDLayer = true;
        if (opt.parent) l.parent = opt.parent;
        setPos(l, x, y, opt.z);
        l.name = opt.name || str.replace(/\r/g, " ").substr(0, 28);
        return l;
    }

    // animator κειμένου: εμφάνιση χαρακτήρα-χαρακτήρα (opacity + position + blur)
    function charReveal(l, t0, t1, yOff) {
        var an = l.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        an.name = "Reveal";
        var props = an.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Opacity").setValue(0);
        props.addProperty("ADBE Text Position 3D").setValue([0, yOff === undefined ? 70 : yOff, 0]);
        try { props.addProperty("ADBE Text Blur").setValue([30, 30]); } catch (err) {}
        var sel = an.property("ADBE Text Selectors");
        var rs = sel.numProperties > 0 ? sel.property(1) : sel.addProperty("ADBE Text Selector");
        var off = rs.property("ADBE Text Percent Offset");
        key(off, [t0, t1], [-100, 100], 50);
        return an;
    }

    // μάσκα που "σκουπίζει" το κείμενο από αριστερά προς τα δεξιά
    function wipe(l, t0, t1) {
        var r = l.sourceRectAtTime(0, false);
        var m = l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var sp = m.property("ADBE Mask Shape");
        function box(wd) {
            var s = new Shape();
            var a = r.left - 10, t = r.top - 12, b = r.top + r.height + 12, x = a + wd;
            s.vertices = [[a, t], [x, t], [x, b], [a, b]];
            s.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
            s.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
            s.closed = true;
            return s;
        }
        sp.setValueAtTime(t0, box(1));
        sp.setValueAtTime(t1, box(r.width + 20));
        try { m.property("ADBE Mask Feather").setValue([40, 0]); } catch (err) {}
        ease(sp, 70);
    }

    function ellipseShape(cx, cy, rx, ry) {
        var k = 0.5523, s = new Shape();
        s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
        s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
        s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
        s.closed = true;
        return s;
    }

    function setMatte(fillL, matteL) {
        try { fillL.setTrackMatte(matteL, TrackMatteType.ALPHA); }
        catch (e1) {
            try { matteL.moveBefore(fillL); fillL.trackMatteType = TrackMatteType.ALPHA; matteL.enabled = false; } catch (e2) {}
        }
    }

    // ================================================================== COMP: σωματίδια
    function buildParticles() {
        var pc = proj.items.addComp("FX_Particles", W, H, 1, DUR, FPS);
        pc.parentFolder = folder;
        pc.bgColor = cBG;
        for (var i = 0; i < 46; i++) {
            var l = shapeLayer(pc, "dot_" + (i + 1));
            var g = grp(l, "dot");
            var sz = 6 + rnd() * 16;
            addEllipse(g, sz, sz);
            var q = rnd();
            addFill(g, q < 0.45 ? cCYAN : (q < 0.8 ? cMAG : cWHITE));
            tr(l, "op").setValue(25 + rnd() * 55);
            var x = Math.round(rnd() * W), y0 = Math.round(rnd() * 2000);
            var sp = Math.round(40 + rnd() * 90), amp = Math.round(10 + rnd() * 40);
            var f = (0.6 + rnd() * 1.4).toFixed(2), ph = (rnd() * 6).toFixed(2);
            tr(l, "pos").expression =
                "var y=((" + y0 + "-time*" + sp + ")%2100+2100)%2100-100;\n" +
                "[" + x + "+Math.sin(time*" + f + "+" + ph + ")*" + amp + ", y]";
        }
        var adj = pc.layers.addSolid([1, 1, 1], "ADJ_Glow", W, H, 1, DUR);
        adj.adjustmentLayer = true;
        glow(adj, 40, 1.0);
        return pc;
    }

    // ================================================================== COMP: λογότυπο
    function buildLogo() {
        var LH = 500;
        var lc = proj.items.addComp("LOGO_PulseX1", W, LH, 1, 4, FPS);
        lc.parentFolder = folder;

        // γραμμή ECG πάνω από το όνομα
        var el = shapeLayer(lc, "Logo_ECG");
        var g = grp(el, "ecg");
        addPath(g, [[-330, 0], [-150, 0], [-100, -50], [-60, 60], [-10, -90], [40, 80], [80, 0], [330, 0]]);
        addStroke(g, cMAG, 10, true);
        var t = addTrim(g);
        setPos(el, 540, 70);
        key(t.property("ADBE Vector Trim End"), [0.2, 1.3], [0, 100], 60);
        glow(el, 30, 1.2);

        var a = txt(lc, "PULSE", 165, cWHITE, 0, 250, { name: "Logo_PULSE" });
        var b = txt(lc, "X1", 165, cCYAN, 0, 250, { name: "Logo_X1" });
        var wa = a.sourceRectAtTime(0, false).width, wb = b.sourceRectAtTime(0, false).width;
        var tot = wa + wb + 30;
        var xa = 540 - tot / 2 + wa / 2, xb = 540 + tot / 2 - wb / 2;
        setPos(a, xa, 250); setPos(b, xb, 250);
        key(tr(a, "pos"), [0.3, 1.1], [[xa - 700, 250], [xa, 250]], 70);
        key(tr(b, "pos"), [0.3, 1.1], [[xb + 700, 250], [xb, 250]], 70);
        tr(a, "pos").expression = BOUNCE_P; tr(b, "pos").expression = BOUNCE_P;
        fade(a, 0.3, 0.7, 0, 100); fade(b, 0.3, 0.7, 0, 100);
        glow(b, 40, 1.5);

        var tg = txt(lc, "ΑΚΟΥΣΕ ΤΗΝ ΚΑΡΔΙΑ ΣΟΥ", 46, cCYAN, 540, 390, { name: "Logo_Tagline", font: FONT_R, tracking: 120 });
        charReveal(tg, 1.0, 2.0, 30);
        return lc;
    }

    // ================================================================== ΡΟΛΟΙ (3D)
    function buildWatch() {
        var rig = main.layers.addNull(DUR);
        rig.name = "WATCH_RIG";
        tr(rig, "anchor").setValue([0, 0]);
        rig.threeDLayer = true;
        rig.label = 11;
        span(rig, 4, DUR);

        function part(name, w, h, r, fill, stroke, sw, x, y, z) {
            var l = roundRect(main, name, w, h, r, fill, stroke, sw);
            l.threeDLayer = true;
            l.parent = rig;
            setPos(l, x, y, z);
            span(l, 4, DUR);
            return l;
        }
        function child(l, x, y, z) {
            l.threeDLayer = true; l.parent = rig; setPos(l, x, y, z); span(l, 4, DUR); return l;
        }

        var strapCol = [0.13, 0.15, 0.27, 1];
        part("Strap_Top", 250, 330, 50, strapCol, null, 0, 0, -340, 12);
        var sb = part("Strap_Bottom", 250, 330, 50, strapCol, null, 0, 0, 340, 12);
        var hg = grp(sb, "holes");
        addEllipse(hg, 22, 22, [0, -90]); addFill(hg, cBG); addRepeater(hg, 4, [0, 60]);

        part("Body", 420, 500, 120, [0.16, 0.18, 0.30, 1], cCYAN, 6, 0, 0, 0);
        part("Crown", 30, 110, 12, cMAG, null, 0, 226, -70, 6);
        part("Button", 22, 70, 10, [0.30, 0.34, 0.55, 1], null, 0, 224, 80, 6);
        var scr = part("Screen", 360, 440, 95, [0.01, 0.01, 0.03, 1], null, 0, 0, 0, -6);

        // δακτύλιος προόδου (Trim Paths) - ενέργεια μπαταρίας / δραστηριότητας
        var trk = shapeLayer(main, "Ring_Track");
        var g1 = grp(trk, "track"); addEllipse(g1, 240, 240); addStroke(g1, [0.17, 0.19, 0.32, 1], 24);
        child(trk, 0, 20, -10);

        var prg = shapeLayer(main, "Ring_Progress");
        var g2 = grp(prg, "progress"); addEllipse(g2, 240, 240);
        addStroke(g2, cMAG, 24, true);
        var tm = addTrim(g2);
        child(prg, 0, 20, -12);
        tr(prg, "rot").setValue(-90);
        key(tm.property("ADBE Vector Trim End"), [6, 9], [0, 82], 70);
        glow(prg, 25, 1.4);

        // αριθμός με expression συνδεδεμένη σε Slider Control
        var pct = txt(main, "82%", 76, cWHITE, 0, 20, { name: "Ring_Percent", threeD: true, parent: rig, z: -14 });
        span(pct, 4, DUR);
        var sl = slider(pct, "Counter");
        key(sl, [6, 9], [0, 82], 70);
        pct.property("ADBE Text Properties").property("ADBE Text Document").expression =
            'Math.round(effect("Counter")("Slider")) + "%"';

        var tm2 = txt(main, "10:09", 84, cWHITE, 0, -150, { name: "Watch_Time", threeD: true, parent: rig, z: -14 });
        span(tm2, 4, DUR);
        var bp = txt(main, "BPM 72", 34, cMAG, 0, 185, { name: "Watch_BPM", threeD: true, parent: rig, z: -14 });
        span(bp, 4, DUR);
        bp.property("ADBE Text Properties").property("ADBE Text Document").expression =
            '"BPM " + Math.round(72 + 4*Math.sin(time*2*Math.PI*1.2))';
        tr(bp, "op").expression = "100*(0.75+0.25*" + BEAT + ")";

        // αντανάκλαση γυαλιού: λωρίδα φωτός + track matte (alpha) από την οθόνη
        var gl = shapeLayer(main, "Glare");
        var gg = grp(gl, "glare"); addRect(gg, 90, 700, 0); addFill(gg, cWHITE);
        gl.blendingMode = BlendingMode.ADD;
        child(gl, -400, 0, -16);
        tr(gl, "rot").setValue(25);
        tr(gl, "op").setValue(35);
        key(tr(gl, "pos"), [5.5, 7.0], [[-400, 0, -16], [400, 0, -16]], 50);
        tr(gl, "pos").expression = "var p=value; loopOut('cycle');";
        var gm = scr.duplicate();
        gm.name = "Glare_Matte";
        setMatte(gl, gm);

        // 3D αστέρια/δακτύλιοι πίσω από το ρολόι (halo)
        function halo(name, d, col, rotExpr, dash) {
            var l = shapeLayer(main, name);
            var g = grp(l, "halo"); addEllipse(g, d, d);
            var s = addStroke(g, col, 6, true);
            try {
                s.property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1").setValue(dash);
                s.property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1").setValue(dash * 1.5);
            } catch (err) {}
            tr(l, "op").setValue(60);
            child(l, 0, 0, 80);
            tr(l, "rot").expression = rotExpr;
            glow(l, 20, 1.0);
            return l;
        }
        halo("Halo_A", 900, cCYAN, "time*22", 40);
        halo("Halo_B", 1040, cMAG, "-time*14", 18);

        // κινήσεις rig:  Position / Scale / Rotation Y  (keyframes + bounce expressions)
        var T = [4, 12, 12.9, 22, 22.9, 28, 28.9];
        key(tr(rig, "pos"), T,
            [[540, 960, 0], [540, 960, 0], [540, 620, 0], [540, 620, 0], [540, 1410, 0], [540, 1410, 0], [540, 930, 0]], 70);
        tr(rig, "pos").expression = BOUNCE_P;
        var sc2 = tr(rig, "scale");
        key(sc2, [4, 4.9, 12, 12.9, 22, 22.9, 28, 28.9],
            [[0, 0, 0], [85, 85, 85], [85, 85, 85], [46, 46, 46], [46, 46, 46], [50, 50, 50], [50, 50, 50], [75, 75, 75]], 70);
        sc2.expression = BOUNCE_S;
        key(tr(rig, "ry"), [4, 4.9, 22, 22.9, 32], [90, 0, 0, 360, 360], 70);
        tr(rig, "ry").expression = "value + Math.sin(time*1.1)*14;";
        key(tr(rig, "rx"), [4, 4.9], [-30, 0], 70);
        tr(rig, "rx").expression = "value + Math.sin(time*0.8)*6;";
        return rig;
    }

    // ================================================================== ΚΑΡΤΕΣ ΧΑΡΑΚΤΗΡΙΣΤΙΚΩΝ
    function featureCard(idx, y, t0, t1, accent, big, small, iconKind) {
        var card = roundRect(main, "Card_" + idx, 920, 220, 50, cCARD, accent, 4);
        setPos(card, 540, y);
        span(card, t0, t1);
        var exitStart = t1 - 0.6 + idx * 0.1;
        key(tr(card, "pos"), [t0, t0 + 0.7, exitStart, t1], [[1500, y], [540, y], [540, y], [-600, y]], 70);
        tr(card, "pos").expression = BOUNCE_P;
        glow(card, 15, 0.5);

        // εικονίδιο (child της κάρτας)
        var ic = shapeLayer(main, "Icon_" + idx);
        var g = grp(ic, "icon");
        if (iconKind === "battery") {
            addRect(g, 120, 66, 14); addStroke(g, accent, 8);
            var nub = grp(ic, "nub"); addRect(nub, 12, 26, 4, [68, 0]); addFill(nub, accent);
            var inner = grp(ic, "level");
            var ir = addRect(inner, 100, 44, 6, [-50, 0]); addFill(inner, accent);
            key(ir.property("ADBE Vector Rect Size"), [t0 + 0.6, t0 + 2.0], [[2, 44], [100, 44]], 60);
            key(ir.property("ADBE Vector Rect Position"), [t0 + 0.6, t0 + 2.0], [[-49, 0], [0, 0]], 60);
        } else if (iconKind === "ecg") {
            addPath(g, [[-65, 0], [-30, 0], [-14, -44], [8, 44], [24, -10], [34, 0], [65, 0]]);
            addStroke(g, accent, 9, true);
            var tt = addTrim(g);
            var te = tt.property("ADBE Vector Trim End");
            key(te, [t0 + 0.5, t0 + 1.5, t0 + 2.2], [0, 100, 100], 60);
            te.expression = "loopOut('cycle')";
        } else {
            addEllipse(g, 78, 78, [0, 16]);
            addPath(g, [[0, -62], [32, 0], [-32, 0]], true);
            addFill(g, accent);
            tr(ic, "pos").expression = "value+[0,Math.sin(time*3)*6]";
        }
        ic.parent = card; setPos(ic, -340, 0);
        if (iconKind !== "drop") tr(ic, "pos").setValue([-340, 0]);
        span(ic, t0, t1);

        var tb = txt(main, big, 78, cWHITE, 105, -38, { name: "Card_" + idx + "_Big", parent: card });
        span(tb, t0, t1); charReveal(tb, t0 + 0.5, t0 + 1.3, 50);
        var ts = txt(main, small, 38, cGREY, 105, 52, { name: "Card_" + idx + "_Small", parent: card, font: FONT_R });
        span(ts, t0, t1); wipe(ts, t0 + 0.9, t0 + 1.7);
        return card;
    }

    // ================================================================== ΚΥΡΙΟ ΚΟΜΜΑΤΙ
    function build() {
        proj = app.project;
        folder = proj.items.addFolder("PULSE_X1_AD");
        scriptFolder = new File($.fileName).parent;

        main = proj.items.addComp("PULSE_X1_Story_1080x1920", W, H, 1, DUR, FPS);
        main.parentFolder = folder;
        main.bgColor = cBG;

        var particles = buildParticles();
        var logo = buildLogo();

        // ---------------- φόντο ----------------
        var bg = main.layers.addSolid(cBG, "BG_Gradient", W, H, 1, DUR);
        var ramp = addFx(bg, "ADBE Ramp", "Gradient Ramp");
        setP(ramp, 1, [540, 0]); setP(ramp, 2, cNAVY);
        setP(ramp, 3, [540, 1920]); setP(ramp, 4, cBG);
        // το χρώμα του φόντου αλλάζει ανά σκηνή
        key(ramp.property(2), [0, 4, 12, 22, 26], [cNAVY, [0.10, 0.07, 0.28, 1], cNAVY, [0.30, 0.04, 0.22, 1], [0.08, 0.10, 0.30, 1]], 60);

        var grid = shapeLayer(main, "GRID_Moving");
        var gv = grp(grid, "vertical"); addRect(gv, 2, H + 240, 0, [-640, 0]); addFill(gv, cWHITE); addRepeater(gv, 17, [80, 0]);
        var gh = grp(grid, "horizontal"); addRect(gh, W + 320, 2, 0, [0, -1040]); addFill(gh, cWHITE); addRepeater(gh, 27, [0, 80]);
        setPos(grid, 540, 960);
        tr(grid, "pos").expression = "[value[0]+(time*30)%80, value[1]+(time*50)%80]";
        tr(grid, "op").setValue(7);

        var pl = main.layers.add(particles, DUR);
        pl.name = "PARTICLES (precomp)";
        pl.blendingMode = BlendingMode.SCREEN;
        tr(pl, "op").setValue(85);

        var cloud = main.layers.addSolid([0, 0, 0], "NOISE_Clouds", W, H, 1, DUR);
        var fn = addFx(cloud, "ADBE Fractal Noise", "Fractal Noise");
        for (var q = 1; q <= fn.numProperties; q++) {
            try { if (fn.property(q).name === "Evolution") fn.property(q).expression = "time*40"; } catch (e1) {}
        }
        cloud.blendingMode = BlendingMode.OVERLAY;
        tr(cloud, "op").setValue(14);

        // ================= ΣΚΗΝΗ 1 (0-4s): HOOK =================
        function ring(delay, col) {
            var l = shapeLayer(main, "Ring_pulse_" + delay);
            var g = grp(l, "ring"); addEllipse(g, 260, 260); addStroke(g, col, 8);
            setPos(l, 540, 960);
            var s = tr(l, "scale"), o = tr(l, "op");
            key(s, [delay, delay + 1.6], [[20, 20], [300, 300]], 40);
            key(o, [delay, delay + 1.6], [90, 0], 40);
            s.expression = "loopOut('cycle')"; o.expression = "loopOut('cycle')";
            span(l, delay, 4.2);
            return l;
        }
        ring(0, cCYAN); ring(0.55, cMAG); ring(1.1, cCYAN);

        var heart = shapeLayer(main, "Heart_dot");
        var hg2 = grp(heart, "dot"); addEllipse(hg2, 90, 90); addFill(hg2, cMAG);
        setPos(heart, 540, 960);
        tr(heart, "scale").expression = "var s=100+25*" + BEAT + "; [s,s]";
        glow(heart, 50, 1.6);
        span(heart, 0, 4.1);

        var ecg = shapeLayer(main, "ECG_Hook");
        var ge = grp(ecg, "line");
        addPath(ge, [[-540, 0], [-300, 0], [-230, 0], [-190, -90], [-130, 160], [-70, -260], [0, 230], [60, -60], [110, 0], [260, 0], [300, 0], [330, -60], [370, 70], [410, 0], [540, 0]]);
        addStroke(ge, cMAG, 14, true);
        var tE = addTrim(ge);
        setPos(ecg, 540, 960);
        key(tE.property("ADBE Vector Trim End"), [0.3, 1.7], [0, 100], 60);
        key(tE.property("ADBE Vector Trim Start"), [3.2, 3.9], [0, 100], 60);
        glow(ecg, 40, 1.6);
        span(ecg, 0, 4.1);

        var h1 = txt(main, "ΑΝ Η ΚΑΡΔΙΑ ΣΟΥ", 84, cWHITE, 540, 520, { name: "Hook_1" });
        charReveal(h1, 0.2, 1.2); span(h1, 0, 3.95); fade(h1, 3.5, 3.95, 100, 0);
        var h2 = txt(main, "ΜΙΛΟΥΣΕ...", 140, cCYAN, 540, 665, { name: "Hook_2" });
        charReveal(h2, 0.9, 2.0); span(h2, 0, 3.95); fade(h2, 3.5, 3.95, 100, 0); glow(h2, 35, 1.2);
        var h3 = txt(main, "ΘΑ ΤΗΝ ΑΚΟΥΣΕΣ;", 78, cMAG, 540, 1330, { name: "Hook_3" });
        charReveal(h3, 2.0, 3.0); span(h3, 0, 3.95); fade(h3, 3.5, 3.95, 100, 0);

        // ================= ΡΟΛΟΙ 3D (4-32s) =================
        var rig = buildWatch();

        // ================= ΣΚΗΝΗ 2 (4-12s): ΑΠΟΚΑΛΥΨΗ =================
        var title = txt(main, "PULSE X1", 150, [0.82, 0.95, 1, 1], 540, 330, { name: "Title_PULSE_X1" });
        span(title, 4.3, 12.3);
        charReveal(title, 4.5, 5.6, 90);
        fade(title, 11.7, 12.2, 100, 0);
        glow(title, 30, 0.8);
        // λάμψη που περνά από το γράμματα (alpha track matte)
        var shine = shapeLayer(main, "Title_Shine");
        var sg = grp(shine, "bar"); addRect(sg, 120, 320, 0); addFill(sg, cWHITE);
        shine.blendingMode = BlendingMode.ADD;
        setPos(shine, -200, 330);
        tr(shine, "rot").setValue(20);
        key(tr(shine, "pos"), [6.0, 6.9, 8.6, 9.5], [[-200, 330], [1300, 330], [-200, 330], [1300, 330]], 50);
        span(shine, 4.3, 12.3);
        var tmatte = txt(main, "PULSE X1", 150, cWHITE, 540, 330, { name: "Title_Matte" });
        span(tmatte, 4.3, 12.3);
        setMatte(shine, tmatte);

        var sub = txt(main, "Το έξυπνο ρολόι που ακούει\rτην καρδιά σου", 52, cWHITE, 540, 470, { name: "Subtitle", font: FONT_R });
        span(sub, 4.3, 12.3); charReveal(sub, 5.4, 6.6, 40); fade(sub, 11.7, 12.2, 100, 0);
        var fl = txt(main, "ΣΧΕΔΙΑΣΜΕΝΟ ΓΙΑ ΝΑ ΣΕ ΑΚΟΛΟΥΘΕΙ", 40, cLIME, 540, 1585, { name: "Scene2_Footer" });
        span(fl, 4.3, 12.3); charReveal(fl, 7.5, 8.8, 40); fade(fl, 11.7, 12.2, 100, 0);

        // ================= ΣΚΗΝΗ 3 (12-22s): ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ =================
        var sh = txt(main, "ΓΙΑΤΙ PULSE X1;", 72, cWHITE, 540, 300, { name: "Scene3_Header" });
        span(sh, 12.3, 22.2); charReveal(sh, 12.4, 13.2, 60); fade(sh, 21.6, 22.1, 100, 0);
        featureCard(1, 1020, 13.0, 22.2, cLIME, "7 ΗΜΕΡΕΣ", "αυτονομία μπαταρίας", "battery");
        featureCard(2, 1260, 15.5, 22.2, cMAG, "24/7 ΚΑΡΔΙΑ", "συνεχής παρακολούθηση ρυθμού", "ecg");
        featureCard(3, 1500, 18.0, 22.2, cCYAN, "50 ΜΕΤΡΑ", "αδιάβροχο για κολύμπι", "drop");

        // ================= ΣΚΗΝΗ 4 (22-28s): ΠΡΟΣΦΟΡΑ =================
        function burst(col, pts, rotExpr, op) {
            var l = shapeLayer(main, "Burst_" + pts);
            var g = grp(l, "star"); addStar(g, pts, 1100, 520); addFill(g, col);
            setPos(l, 540, 610);
            tr(l, "op").setValue(op);
            tr(l, "rot").expression = rotExpr;
            span(l, 22.2, 28.3);
            key(tr(l, "scale"), [22.2, 23.0, 27.6, 28.3], [[0, 0], [100, 100], [100, 100], [160, 160]], 70);
            tr(l, "scale").expression = "var b=" + BEAT + "; value*(1+0.03*b)";
            return l;
        }
        burst(cMAG, 14, "time*12", 22);
        burst(cCYAN, 10, "-time*8", 14);

        var o1 = txt(main, "ΠΡΟΣΦΟΡΑ ΕΚΙΝΗΣΗΣ", 70, cWHITE, 540, 330, { name: "Offer_Header" });
        span(o1, 22.3, 28.3); charReveal(o1, 22.4, 23.3, 60); fade(o1, 27.8, 28.2, 100, 0);

        var o2 = txt(main, "-30%", 300, cWHITE, 540, 620, { name: "Offer_Percent" });
        span(o2, 22.3, 28.3);
        var sl2 = slider(o2, "Counter");
        key(sl2, [23.0, 24.4], [0, 30], 70);
        o2.property("ADBE Text Properties").property("ADBE Text Document").expression =
            '"-" + Math.round(effect("Counter")("Slider")) + "%"';
        key(tr(o2, "scale"), [22.9, 23.7], [[0, 0], [100, 100]], 70);
        tr(o2, "scale").expression = BOUNCE_S;
        glow(o2, 40, 1.0);
        fade(o2, 27.8, 28.2, 100, 0);
        var ds = addFx(o2, "ADBE Drop Shadow", "Shadow");
        setP(ds, 2, 200); setP(ds, 4, 18); setP(ds, 5, 30);

        var oldp = txt(main, "€299", 80, cGREY, 540, 830, { name: "Offer_OldPrice" });
        span(oldp, 22.3, 28.3); fade(oldp, 24.0, 24.5, 0, 100); fade(oldp, 27.8, 28.2, 100, 0);
        var strike = shapeLayer(main, "Offer_Strike");
        var sk = grp(strike, "line"); addRect(sk, 250, 9, 0, [125, 0]); addFill(sk, cMAG);
        setPos(strike, 415, 830);
        tr(strike, "rot").setValue(-7);
        key(tr(strike, "scale"), [24.6, 25.1], [[0, 100], [100, 100]], 70);
        span(strike, 22.3, 28.3); fade(strike, 27.8, 28.2, 100, 0);

        var newp = txt(main, "€209", 190, cLIME, 540, 975, { name: "Offer_NewPrice" });
        span(newp, 22.3, 28.3);
        var sl3 = slider(newp, "Counter");
        key(sl3, [24.4, 25.9], [299, 209], 70);
        newp.property("ADBE Text Properties").property("ADBE Text Document").expression =
            '"€" + Math.round(effect("Counter")("Slider"))';
        key(tr(newp, "scale"), [24.3, 25.0], [[0, 0], [100, 100]], 70);
        tr(newp, "scale").expression = BOUNCE_S;
        glow(newp, 35, 1.1);
        fade(newp, 27.8, 28.2, 100, 0);

        var pill = roundRect(main, "Countdown_Pill", 820, 100, 50, cCARD, cCYAN, 3);
        setPos(pill, 540, 1115);
        span(pill, 22.3, 28.3);
        key(tr(pill, "scale"), [25.0, 25.7], [[0, 0], [100, 100]], 70);
        tr(pill, "scale").expression = BOUNCE_S;
        fade(pill, 27.8, 28.2, 100, 0);
        var cd = txt(main, "ΛΗΓΕΙ ΣΕ  71:59:59", 50, cWHITE, 540, 1115, { name: "Countdown_Text" });
        span(cd, 25.3, 28.3);
        cd.property("ADBE Text Properties").property("ADBE Text Document").expression =
            "var s=259199-Math.floor((time-25.5)*3000); if (s>259199) s=259199; if (s<0) s=0;\n" +
            "function p(n){ return (n<10?'0':'')+n; }\n" +
            "'ΛΗΓΕΙ ΣΕ  ' + p(Math.floor(s/3600)) + ':' + p(Math.floor((s%3600)/60)) + ':' + p(s%60);";
        fade(cd, 27.8, 28.2, 100, 0);

        // ================= ΣΚΗΝΗ 5 (28-32s): CALL TO ACTION =================
        var lg = main.layers.add(logo, 4);
        lg.name = "LOGO (precomp + time remap)";
        lg.startTime = 28;
        setPos(lg, 540, 360);
        lg.timeRemapEnabled = true;
        var rm = lg.property("ADBE Time Remapping");
        rm.setValueAtTime(28, 0); rm.setValueAtTime(29.6, 2.2); rm.setValueAtTime(31.99, 2.9);
        fade(lg, 31.6, 32, 100, 0);

        var btn = roundRect(main, "CTA_Button", 760, 140, 70, cLIME, null, 0);
        setPos(btn, 540, 1400);
        span(btn, 28.6, DUR);
        glow(btn, 40, 0.9);
        var btxt = txt(main, "ΠΑΡΕ ΤΟ ΤΩΡΑ", 60, [0.04, 0.05, 0.12, 1], 0, 0, { name: "CTA_Text", parent: btn });
        span(btxt, 28.6, DUR);
        // παλμός κουμπιού στο beat μετά την είσοδο
        var bs = tr(btn, "scale");
        bs.setValue([100, 100]);
        bs.expression = "var b=" + BEAT + "; var e=ease(time,28.7,29.4,0,100); var o=(time>29.6)?4*b:0; var s=e+o; [s,s]";

        var hd = txt(main, "@pulse.x1   #PulseX1", 36, cGREY, 540, 1510, { name: "CTA_Handle", font: FONT_R });
        span(hd, 29.2, DUR); charReveal(hd, 29.3, 30.0, 30);
        var sw = txt(main, "ΣΥΡΕ ΠΡΟΣ ΤΑ ΠΑΝΩ", 36, cWHITE, 540, 1565, { name: "CTA_Swipe" });
        span(sw, 29.6, DUR); charReveal(sw, 29.7, 30.5, 30);

        var chev = shapeLayer(main, "CTA_Chevrons");
        var cg = grp(chev, "chev"); addPath(cg, [[-40, 18], [0, -18], [40, 18]]);
        addStroke(cg, cLIME, 10, true); addRepeater(cg, 2, [0, 32]);
        setPos(chev, 540, 1615);
        tr(chev, "pos").expression = "value+[0,-Math.abs(Math.sin(time*4))*18]";
        span(chev, 29.8, DUR); fade(chev, 29.8, 30.2, 0, 100);

        // ================= ΚΑΜΕΡΑ =================
        var cam = main.layers.addCamera("CAM_Dolly", [W / 2, H / 2]);
        try { cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(1500); } catch (e3) {}
        key(tr(cam, "pos"), [0, 4, 12, 22, 28, 32],
            [[540, 960, -1500], [540, 960, -1500], [450, 960, -1400], [640, 960, -1420], [540, 960, -1460], [540, 960, -1330]], 60);

        // ================= ΜΕΤΑΒΑΣΕΙΣ / ΤΕΛΙΚΕΣ ΕΠΙΛΟΓΕΣ =================
        var cuts = [4, 12, 22, 28];
        var ft = [], fv = [], bt = [], bv = [];
        for (var i = 0; i < cuts.length; i++) {
            var c = cuts[i];
            ft.push(c - 0.1, c, c + 0.3); fv.push(0, 55, 0);
            bt.push(c - 0.15, c, c + 0.35); bv.push(0, 55, 0);
        }
        var flash = main.layers.addSolid(cWHITE, "FX_Flash", W, H, 1, DUR);
        tr(flash, "op").setValue(0);
        key(tr(flash, "op"), ft, fv, 50);

        var adjBlur = main.layers.addSolid([1, 1, 1], "ADJ_TransitionBlur", W, H, 1, DUR);
        adjBlur.adjustmentLayer = true;
        var gb = addFx(adjBlur, "ADBE Gaussian Blur 2", "Blur");
        key(gb.property(1), bt, bv, 50);
        setP(gb, 3, true);

        var adjGlow = main.layers.addSolid([1, 1, 1], "ADJ_GlobalGlow", W, H, 1, DUR);
        adjGlow.adjustmentLayer = true;
        glow(adjGlow, 30, 0.35);
        tr(adjGlow, "op").setValue(80);

        var vg = main.layers.addSolid([0, 0, 0], "VIGNETTE", W, H, 1, DUR);
        var vm = vg.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        vm.property("ADBE Mask Shape").setValue(ellipseShape(540, 960, 720, 1150));
        try { vm.inverted = true; vm.property("ADBE Mask Feather").setValue([420, 420]); } catch (e4) {}
        tr(vg, "op").setValue(65);

        // Safe zone (δεν αποδίδεται στο render: guide layer)
        var sz = shapeLayer(main, "GUIDE_InstagramSafeZone");
        var szg = grp(sz, "top"); addRect(szg, W, 250, 0, [0, -835]); addStroke(szg, [1, 0.2, 0.2, 1], 3);
        var szb = grp(sz, "bottom"); addRect(szb, W, 250, 0, [0, 835]); addStroke(szb, [1, 0.2, 0.2, 1], 3);
        setPos(sz, 540, 960);
        sz.guideLayer = true;

        // Markers ανά σκηνή
        var mk = [[0, "Σκηνή 1 - Hook"], [4, "Σκηνή 2 - Αποκάλυψη προϊόντος"], [12, "Σκηνή 3 - Χαρακτηριστικά"],
                  [22, "Σκηνή 4 - Προσφορά"], [28, "Σκηνή 5 - Call to Action"]];
        for (var m = 0; m < mk.length; m++) main.markerProperty.setValueAtTime(mk[m][0], new MarkerValue(mk[m][1]));

        // Μουσική
        try {
            var af = new File(scriptFolder.fsName + "/assets/pulse_soundtrack.wav");
            if (af.exists) {
                var au = proj.importFile(new ImportOptions(af));
                au.parentFolder = folder;
                var al = main.layers.add(au);
                al.name = "MUSIC_pulse_soundtrack";
                var lv = al.property("ADBE Audio Group").property("ADBE Audio Levels");
                key(lv, [30.2, 32], [[0, 0], [-40, -40]], 50);
            } else {
                alert("Δεν βρέθηκε το assets/pulse_soundtrack.wav δίπλα στο script. Η διαφήμιση δημιουργήθηκε χωρίς μουσική.");
            }
        } catch (e5) {}

        // Render queue (δεν ξεκινά αυτόματα)
        try {
            var rqi = proj.renderQueue.items.add(main);
            var om = rqi.outputModule(1);
            try { om.applyTemplate("H.264 - Match Render Settings - 15 Mbps"); } catch (e6) {}
            om.file = new File(scriptFolder.fsName + "/PULSE_X1_Story_1080x1920.mp4");
        } catch (e7) {}

        main.time = 0;
        main.openInViewer();
    }

    app.beginUndoGroup("PULSE X1 - Instagram Story Ad");
    try {
        build();
    } catch (err) {
        alert("Σφάλμα στο script: " + err.toString() + "\nΓραμμή: " + err.line);
    }
    app.endUndoGroup();
})();
