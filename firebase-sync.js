import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuQZUhTfJhpf33JioWKdrgp8YwuY18e2Y",
  authDomain: "vacances-73619.firebaseapp.com",
  projectId: "vacances-73619",
  storageBucket: "vacances-73619.firebasestorage.app",
  messagingSenderId: "861120662557",
  appId: "1:861120662557:web:b4e7ecf6257c5734530af4",
  measurementId: "G-TZ4QFX9QHK"
};

const userChip = document.querySelector("#userChip");
const syncDot = document.querySelector("#syncDot");
const syncLabel = document.querySelector("#syncLabel");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const tripRef = doc(db, "trips", "embrun-2027");
let user = null;
let pendingData = null;
let userName = localStorage.getItem("zigotos-first-name-v1") || "";
let lastRemoteData = null;

function setStatus(label, state = "") {
  syncDot.classList.remove("online", "error");
  if (state) syncDot.classList.add(state);
  userChip.title = label;
  syncLabel.textContent = label;
  syncLabel.classList.toggle("error", state === "error");
  if (state === "online" || state === "error") window.dispatchEvent(new Event("trip-sync-ready"));
  if (state === "error") document.querySelector("#lastEditor").textContent = "Firebase n'est pas connecté : les changements restent uniquement sur cet appareil.";
}

async function writeSharedData(content) {
  if (!user || !userName) {
    pendingData = content;
    setStatus("En attente de connexion");
    return;
  }
  setStatus("Synchronisation…");
  try {
    const changedSections = lastRemoteData
      ? ["text", "days", "activities", "budgets", "faqs", "checklist", "shopping", "ideas", "assistanceContacts"].filter(section => JSON.stringify(lastRemoteData[section]) !== JSON.stringify(content[section]))
      : ["initialisation"];
    await setDoc(tripRef, {
      contentJson: JSON.stringify(content),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
      updatedByName: userName
    });
    lastRemoteData = structuredClone(content);
    setStatus("Synchronisé", "online");
    try {
      await addDoc(collection(db, "trips", "embrun-2027", "history"), {
        contentJson: JSON.stringify(content),
        changedSections,
        changedByUid: user.uid,
        changedByName: userName,
        changedAt: serverTimestamp()
      });
    } catch (historyError) {
      console.warn("Firebase history save failed", historyError);
    }
    return true;
  } catch (error) {
    console.error("Firebase save failed", error);
    pendingData = content;
    setStatus("Sauvegardé localement", "error");
    return false;
  }
}

window.saveSharedTrip = content => writeSharedData(structuredClone(content));

async function connect() {
  try {
    setStatus("Connexion…");
    const credential = await signInAnonymously(auth);
    user = credential.user;
    onSnapshot(tripRef, async snapshot => {
      if (snapshot.exists()) {
        const snapshotData = snapshot.data();
        let remote = null;
        try {
          remote = snapshotData.contentJson ? JSON.parse(snapshotData.contentJson) : snapshotData.content;
        } catch (parseError) {
          console.error("Firebase data parse failed", parseError);
          setStatus("Données partagées illisibles", "error");
          return;
        }
        lastRemoteData = remote ? structuredClone(remote) : null;
        if (remote) window.dispatchEvent(new CustomEvent("shared-trip-data", { detail: remote }));
        const editor = snapshotData.updatedByName;
        const editorLabel = document.querySelector("#lastEditor");
        if (editor) editorLabel.textContent = `Dernière modification partagée par ${editor}.`;
        setStatus(snapshot.metadata.hasPendingWrites ? "Synchronisation…" : "Synchronisé", snapshot.metadata.hasPendingWrites ? "" : "online");
      } else {
        await writeSharedData(window.getTripData());
      }
    }, error => {
      console.error("Firebase listener failed", error);
      setStatus("Mode local", "error");
    });
    if (pendingData) {
      const queued = pendingData;
      pendingData = null;
      await writeSharedData(queued);
    }
  } catch (error) {
    console.error("Firebase connection failed", error);
    setStatus("Mode local", "error");
  }
}

window.addEventListener("trip-user-ready", event => {
  userName = event.detail;
  if (!user) connect();
});

if (userName) connect();
