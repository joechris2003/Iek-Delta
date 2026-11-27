# Εφαρμογή για εργασίες και βαθμούς μαθημάτων
import os
import shutil
import sqlite3
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

MATHIMATA = ["Προγραμματισμός", "Βάσεις Δεδομένων", "Δίκτυα", "Μαθηματικά", "Αγγλικά"]

# φάκελος που αποθηκεύονται η βάση και τα pdf
folder = os.path.join(os.path.expanduser("~"), "vathmoi")
pdf_folder = os.path.join(folder, "pdf")
os.makedirs(pdf_folder, exist_ok=True)

conn = sqlite3.connect(os.path.join(folder, "vathmoi.db"))
cur = conn.cursor()
cur.execute("""CREATE TABLE IF NOT EXISTS vathmoi (
    id INTEGER PRIMARY KEY,
    foititis TEXT,
    mathima TEXT,
    b1 REAL,
    b2 REAL,
    b3 REAL,
    pdf TEXT,
    UNIQUE (foititis, mathima)
)""")
conn.commit()


def pare_grammi(foititis, mathima):
    cur.execute("SELECT id, b1, b2, b3, pdf FROM vathmoi WHERE foititis=? AND mathima=?",
                (foititis, mathima))
    return cur.fetchone()


def diavase_vathmo(keimeno):
    # επιστρέφει None αν είναι κενό
    keimeno = keimeno.strip().replace(",", ".")
    if keimeno == "":
        return None
    vathmos = float(keimeno)  # σφάλμα αν δεν είναι αριθμός
    if not (0 <= vathmos <= 10):
        raise ValueError("Ο βαθμός πρέπει να είναι από 0 έως 10")
    return vathmos


def mesos_oros(b1, b2, b3):
    if b1 is None or b2 is None or b3 is None:
        return None
    return (b1 + b2 + b3) / 3


def apothikeusi():
    foititis = onoma.get().strip()
    mathima = mathima_box.get()
    if foititis == "":
        minima.config(text="Γράψε το όνομα του φοιτητή", fg="red")
        return
    try:
        b = [diavase_vathmo(e.get()) for e in vathmoi_entries]
    except ValueError:
        minima.config(text="Λάθος βαθμός (πρέπει να είναι αριθμός από 0 έως 10)", fg="red")
        return

    if pare_grammi(foititis, mathima) is None:
        cur.execute("INSERT INTO vathmoi (foititis, mathima, b1, b2, b3) VALUES (?,?,?,?,?)",
                    (foititis, mathima, b[0], b[1], b[2]))
    else:
        cur.execute("UPDATE vathmoi SET b1=?, b2=?, b3=? WHERE foititis=? AND mathima=?",
                    (b[0], b[1], b[2], foititis, mathima))
    conn.commit()

    mo = mesos_oros(b[0], b[1], b[2])
    if mo is None:
        minima.config(text="Αποθηκεύτηκε. Βάλε και τους 3 βαθμούς για να βγει ο Μ.Ο.", fg="black")
    elif mo >= 5:
        minima.config(text="Επιτυχία! Μ.Ο. = %.2f" % mo, fg="green")
        messagebox.showinfo("Επιτυχία", mathima + ": Επιτυχία! Μ.Ο. = %.2f" % mo)
    else:
        minima.config(text="Αποτυχία. Μ.Ο. = %.2f" % mo, fg="red")
        messagebox.showwarning("Αποτυχία", mathima + ": Αποτυχία. Μ.Ο. = %.2f" % mo)
    deixe_vathmous()


def deixe_vathmous():
    # καθαρίζει τον πίνακα και τον γεμίζει ξανά
    for g in pinakas.get_children():
        pinakas.delete(g)
    foititis = onoma.get().strip()
    if foititis == "":
        return
    for mathima in MATHIMATA:
        grammi = pare_grammi(foititis, mathima)
        if grammi is None:
            pinakas.insert("", "end", values=(mathima, "-", "-", "-", "-", "-", "-"))
            continue
        b1, b2, b3, pdf = grammi[1], grammi[2], grammi[3], grammi[4]
        mo = mesos_oros(b1, b2, b3)
        if mo is None:
            apotelesma = "-"
            mo_text = "-"
        else:
            mo_text = "%.2f" % mo
            if mo >= 5:
                apotelesma = "Επιτυχία"
            else:
                apotelesma = "Αποτυχία"
        if pdf is None:
            ergasia = "-"
        else:
            ergasia = "ναι"
        pinakas.insert("", "end", values=(mathima, b1, b2, b3, mo_text, apotelesma, ergasia))


def fortose_pedia(event=None):
    # βάζει στα πεδία τους βαθμούς που υπάρχουν ήδη
    for e in vathmoi_entries:
        e.delete(0, "end")
    foititis = onoma.get().strip()
    grammi = pare_grammi(foititis, mathima_box.get())
    if grammi is None:
        pdf_label.config(text="Καμία εργασία")
        return
    for i in range(3):
        if grammi[i + 1] is not None:
            vathmoi_entries[i].insert(0, str(grammi[i + 1]))
    if grammi[4] is None:
        pdf_label.config(text="Καμία εργασία")
    else:
        pdf_label.config(text="Υπάρχει εργασία")


def allagi_foititi(event=None):
    deixe_vathmous()
    fortose_pedia()


def epilogi_grammis(event=None):
    epilogi = pinakas.selection()
    if len(epilogi) > 0:
        mathima_box.set(pinakas.item(epilogi[0], "values")[0])
        fortose_pedia()


def anebase_pdf():
    foititis = onoma.get().strip()
    mathima = mathima_box.get()
    if foititis == "":
        minima.config(text="Γράψε το όνομα του φοιτητή", fg="red")
        return
    arxeio = filedialog.askopenfilename(filetypes=[("PDF", "*.pdf")])
    if arxeio == "":
        return
    if not arxeio.lower().endswith(".pdf"):
        minima.config(text="Το αρχείο πρέπει να είναι pdf", fg="red")
        return
    if pare_grammi(foititis, mathima) is None:
        cur.execute("INSERT INTO vathmoi (foititis, mathima) VALUES (?,?)", (foititis, mathima))
        conn.commit()
    id = pare_grammi(foititis, mathima)[0]
    # το αρχείο παίρνει όνομα με το id για να μην έχει ελληνικά
    neo = os.path.join(pdf_folder, "ergasia_" + str(id) + ".pdf")
    shutil.copyfile(arxeio, neo)
    cur.execute("UPDATE vathmoi SET pdf=? WHERE id=?", (neo, id))
    conn.commit()
    minima.config(text="Η εργασία αποθηκεύτηκε στο " + neo, fg="black")
    deixe_vathmous()
    fortose_pedia()


def anoixe_pdf():
    grammi = pare_grammi(onoma.get().strip(), mathima_box.get())
    if grammi is None or grammi[4] is None:
        minima.config(text="Δεν υπάρχει εργασία για αυτό το μάθημα", fg="red")
        return
    arxeio = grammi[4]
    if not os.path.exists(arxeio):
        minima.config(text="Δεν βρέθηκε το αρχείο " + arxeio, fg="red")
        return
    if os.name == "nt":
        os.startfile(arxeio)
    else:
        os.system('xdg-open "' + arxeio + '" &')
    minima.config(text="Άνοιξε η εργασία", fg="black")


def main():
    global onoma, mathima_box, vathmoi_entries, pdf_label, pinakas, minima

    window = tk.Tk()
    window.title("Εργασίες και Βαθμολογίες")

    tk.Label(window, text="Φοιτητής:").grid(row=0, column=0, sticky="w")
    cur.execute("SELECT DISTINCT foititis FROM vathmoi")
    onoma = ttk.Combobox(window, values=[r[0] for r in cur.fetchall()])
    onoma.grid(row=0, column=1)
    onoma.bind("<<ComboboxSelected>>", allagi_foititi)
    onoma.bind("<Return>", allagi_foititi)

    tk.Label(window, text="Μάθημα:").grid(row=1, column=0, sticky="w")
    mathima_box = ttk.Combobox(window, values=MATHIMATA, state="readonly")
    mathima_box.current(0)
    mathima_box.grid(row=1, column=1)
    mathima_box.bind("<<ComboboxSelected>>", fortose_pedia)

    vathmoi_entries = []
    for i in range(3):
        tk.Label(window, text="Βαθμός " + str(i + 1) + ":").grid(row=2 + i, column=0, sticky="w")
        e = tk.Entry(window)
        e.grid(row=2 + i, column=1)
        vathmoi_entries.append(e)

    tk.Button(window, text="Αποθήκευση βαθμών", command=apothikeusi).grid(row=5, column=1, pady=5)
    tk.Label(window, text="Εργασία:").grid(row=6, column=0, sticky="w")
    pdf_label = tk.Label(window, text="Καμία εργασία")
    pdf_label.grid(row=6, column=1)
    tk.Button(window, text="Ανέβασμα εργασίας (pdf)", command=anebase_pdf).grid(row=7, column=0, pady=5)
    tk.Button(window, text="Άνοιγμα εργασίας", command=anoixe_pdf).grid(row=7, column=1, pady=5)

    tk.Button(window, text="Εμφάνιση βαθμολογιών", command=deixe_vathmous).grid(row=0, column=2, padx=10)
    stiles = ("mathima", "b1", "b2", "b3", "mo", "apotelesma", "ergasia")
    titloi = ("Μάθημα", "Βαθμός 1", "Βαθμός 2", "Βαθμός 3", "Μ.Ο.", "Αποτέλεσμα", "Εργασία")
    pinakas = ttk.Treeview(window, columns=stiles, show="headings", height=6)
    for stili, titlos in zip(stiles, titloi):
        pinakas.heading(stili, text=titlos)
        pinakas.column(stili, width=90)
    pinakas.column("mathima", width=130)
    pinakas.grid(row=1, column=2, rowspan=6, padx=10)
    pinakas.bind("<<TreeviewSelect>>", epilogi_grammis)

    minima = tk.Label(window, text="", wraplength=500)
    minima.grid(row=8, column=0, columnspan=3, pady=8)

    window.mainloop()
    conn.close()


if __name__ == "__main__":
    main()
