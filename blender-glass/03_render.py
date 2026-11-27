# Βήμα 3: τελικό render -> glass_render.png
import bpy
import sys

bpy.ops.wm.open_mainfile(filepath="glass_scene.blend")
scene = bpy.context.scene

# αν δώσω "test" κάνει γρήγορο render
if "test" in sys.argv:
    scene.render.resolution_percentage = 25
    scene.cycles.samples = 48
    out = "test.png"
else:
    out = "glass_render.png"

scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("done", out)
