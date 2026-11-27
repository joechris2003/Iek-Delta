# PULSE X1 – Διαφήμιση Instagram Story (After Effects)

Φανταστικό προϊόν τεχνολογίας: έξυπνο ρολόι **PULSE X1**. Διάσταση 1080×1920, 30 fps, **32 δευτερόλεπτα**.

## Πώς το τρέχετε
1. Ανοίξτε το After Effects (2020 ή νεότερο).
2. `File > Scripts > Run Script File…` και επιλέξτε `PULSE_X1_Story_Ad.jsx`.
3. Το script φτιάχνει τις συνθέσεις, τα layers, τα animations και εισάγει τη μουσική από το `assets/`.
4. Πατήστε Space για προεπισκόπηση. Το render queue είναι έτοιμο (H.264) αλλά δεν ξεκινά μόνο του.
5. Αν κάτι αποτύχει, το script εμφανίζει μήνυμα με τη γραμμή του σφάλματος.

Το script δεν έχει δοκιμαστεί μέσα στο After Effects, μόνο ως προς τη σύνταξη. Ελέγξτε το αποτέλεσμα και διορθώστε ό,τι χρειάζεται, π.χ. θέσεις κειμένων ή ονόματα fonts.
Η μουσική παράγεται με `python3 make_soundtrack.py` (120 BPM, ώστε τα cuts να πέφτουν στα beats).

## Σκηνοθεσία (storyboard)
| Χρόνος | Σκηνή | Τι συμβαίνει |
|---|---|---|
| 0–4s | Hook | Παλμός, γραμμή ECG που σχεδιάζεται, κείμενο «Αν η καρδιά σου μιλούσε…» |
| 4–12s | Αποκάλυψη | Το ρολόι (3D) μπαίνει με ελατήριο, τίτλος με λάμψη, κάμερα dolly |
| 12–22s | Χαρακτηριστικά | 3 κάρτες: μπαταρία, καρδιακός ρυθμός, αδιάβροχο |
| 22–28s | Προσφορά | Burst, μετρητής -30%, τιμή €299→€209, αντίστροφη μέτρηση |
| 28–32s | CTA | Λογότυπο, κουμπί «Πάρε το τώρα», swipe up, fade out |

## Τεχνικές που χρησιμοποιούνται
- Συνθέσεις και precomps (`FX_Particles`, `LOGO_PulseX1`), time remapping
- Shape layers: rect, ellipse, star, path, fill, stroke, **Trim Paths**, **Repeater**, dashes
- Text animators (εμφάνιση ανά χαρακτήρα, blur), source text expressions
- Keyframes με easy ease, expressions (`wiggle`-style κίνηση, `loopOut`, inertial bounce, beat pulse)
- Slider Control σε αριθμητικούς μετρητές
- Masks (wipe κειμένου, vignette με feather και invert)
- Track matte (alpha) για τη λάμψη στον τίτλο και την αντανάκλαση στην οθόνη
- Null object και parenting, 3D layers, κάμερα, rotation και scale στο 3D
- Adjustment layers: Gaussian Blur στα cuts, Glow, flash, Gradient Ramp, Fractal Noise, Drop Shadow
- Blend modes (Add, Screen, Overlay), markers ανά σκηνή, guide layer για τα safe zones του Instagram, ήχος με fade out

## Σημειώσεις
- Τα κείμενα βρίσκονται εκτός των 250px πάνω και κάτω (safe zone του Instagram).
- Το προϊόν και το brand είναι φανταστικά.

## Βίντεο προεπισκόπησης
`PULSE_X1_Story_light.mp4` (ανοιχτή παλέτα, `node preview/render_video.js out.mp4 32 light`) και `PULSE_X1_Story_preview.mp4` (σκούρη)  (1080x1920, 30fps, 32s, με μουσική) είναι render από animation σε canvas (`preview/ad.html`, `node preview/render_video.js`). Ακολουθεί τις ίδιες σκηνές και χρόνους με το script του After Effects, αλλά δεν είναι render του After Effects.
