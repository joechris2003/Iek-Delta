# Βήμα 2: υλικό γυαλιού + φωτισμός studio
# ανοίγει το glass_model.blend και σώζει το glass_scene.blend
import bpy
import math

bpy.ops.wm.open_mainfile(filepath="glass_model.blend")
scene = bpy.context.scene
glass = bpy.data.objects["Poteri"]

# --- υλικό γυαλιού ---
mat = bpy.data.materials.new("Gyali")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
bsdf.inputs["Roughness"].default_value = 0.0
bsdf.inputs["IOR"].default_value = 1.5
bsdf.inputs["Transmission Weight"].default_value = 1.0
glass.data.materials.append(mat)

# --- πάτωμα ---
bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "Patwma"
fmat = bpy.data.materials.new("Patwma")
fmat.use_nodes = True
fb = fmat.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1)
fb.inputs["Roughness"].default_value = 0.5
fb.inputs["Specular IOR Level"].default_value = 0.0
floor.data.materials.append(fmat)

# --- φόντο (καμπύλο backdrop) ---
bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 1.0, 0))
back = bpy.context.object
back.name = "Fonto"
back.rotation_euler = (math.radians(90), 0, 0)
back.location = (0, 1.2, 2.9)
bmat = bpy.data.materials.new("Fonto")
bmat.use_nodes = True
bb = bmat.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1)
bb.inputs["Roughness"].default_value = 0.8
bb.inputs["Specular IOR Level"].default_value = 0.0
back.data.materials.append(bmat)

# --- φώτα ---
def area_light(name, loc, rot, size_x, size_y, power):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size = size_x
    ld.size_y = size_y
    ld.energy = power
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    scene.collection.objects.link(ob)
    return ob

# δύο μακριά softbox στα πλάγια (δίνουν τις λωρίδες στο ποτήρι)
area_light("Left", (-0.55, 0.35, 0.18), (90, 0, -60), 0.10, 0.8, 35)
area_light("Right", (0.55, 0.35, 0.18), (90, 0, 60), 0.10, 0.8, 35)
# ένα από πίσω για να φωτίζει το φόντο/χείλος
area_light("Back", (0, 0.9, 0.35), (90, 0, 180), 0.6, 0.25, 6)

# --- κάμερα ---
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
cam.location = (0, -0.9, 0.125)
cam.rotation_euler = (math.radians(87), 0, 0)
scene.camera = cam

# focus στο ποτήρι
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 0.9
cam_data.dof.aperture_fstop = 11

# --- world (σχεδόν μαύρο) ---
world = bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.005, 0.005, 0.006, 1)
scene.world = world

# --- ρυθμίσεις render ---
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 512
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 16
scene.cycles.transmission_bounces = 16
scene.cycles.glossy_bounces = 8
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.render.resolution_x = 2000
scene.render.resolution_y = 2500
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'

bpy.ops.wm.save_as_mainfile(filepath="glass_scene.blend")
print("saved scene")
