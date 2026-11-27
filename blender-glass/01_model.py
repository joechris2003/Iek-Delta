# Βήμα 1: μοντέλο ποτηριού (μόνο σχήμα, χωρίς υλικά)
# τρέχει με:  python 01_model.py   (χρειάζεται το πακέτο bpy)
import bpy
import math

# καθαρίζω τη σκηνή
bpy.ops.wm.read_factory_settings(use_empty=True)

# προφίλ του ποτηριού (ακτίνα, ύψος) σε μέτρα
# πρώτα η εξωτερική πλευρά από τη βάση μέχρι το χείλος
outer = [
    (0.000, 0.000),
    (0.038, 0.000),
    (0.042, 0.002),
    (0.042, 0.004),
    (0.038, 0.007),
    (0.028, 0.010),
    (0.016, 0.014),
    (0.009, 0.020),
    (0.0065, 0.030),
    (0.0055, 0.050),
    (0.0055, 0.070),
    (0.0065, 0.085),
    (0.011, 0.095),
    (0.020, 0.103),
    (0.030, 0.113),
    (0.038, 0.128),
    (0.042, 0.146),
    (0.042, 0.164),
    (0.039, 0.182),
    (0.035, 0.195),
    (0.0335, 0.200),
]
# το χείλος (λίγο στρογγυλεμένο)
rim = [
    (0.0325, 0.2015),
    (0.0305, 0.200),
]
# εσωτερική πλευρά από πάνω προς τα κάτω, πάχος περίπου 2.5mm
inner = [
    (0.0325, 0.195),
    (0.036, 0.182),
    (0.0395, 0.164),
    (0.0395, 0.146),
    (0.0355, 0.128),
    (0.0275, 0.113),
    (0.0175, 0.103),
    (0.0085, 0.097),
    (0.000, 0.095),
]

pts = outer + rim + inner

verts = [(x, 0.0, z) for (x, z) in pts]
edges = [(i, i + 1) for i in range(len(verts) - 1)]

mesh = bpy.data.meshes.new("profil")
mesh.from_pydata(verts, edges, [])
mesh.update()

glass = bpy.data.objects.new("Poteri", mesh)
bpy.context.scene.collection.objects.link(glass)
bpy.context.view_layer.objects.active = glass
glass.select_set(True)

# περιστροφή γύρω από τον άξονα Z
screw = glass.modifiers.new("Screw", 'SCREW')
screw.axis = 'Z'
screw.angle = math.radians(360)
screw.steps = 64
screw.render_steps = 64
screw.use_merge_vertices = True
screw.merge_threshold = 0.0005
bpy.ops.object.modifier_apply(modifier="Screw")

# διορθώνω τα normals
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# subdivision για να βγουν ομαλές καμπύλες
sub = glass.modifiers.new("Subsurf", 'SUBSURF')
sub.levels = 1
sub.render_levels = 2
bpy.ops.object.modifier_apply(modifier="Subsurf")

bpy.ops.object.shade_smooth()

glass.name = "Poteri"
bpy.ops.wm.save_as_mainfile(filepath="glass_model.blend")
print("ok, vertices:", len(glass.data.vertices))
