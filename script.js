// Import Firebase modules using the modular API (version 11.6.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Replace the following with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7DyF7Sxadu2Cs5irRJLqv1t0iBkutMF4",
  authDomain: "cefsa-eaglegames-ee955.firebaseapp.com",
  databaseURL: "https://cefsa-eaglegames-ee955-default-rtdb.firebaseio.com",
  projectId: "cefsa-eaglegames-ee955",
  storageBucket: "cefsa-eaglegames-ee955.firebasestorage.app",
  messagingSenderId: "293229596792",
  appId: "1:293229596792:web:633946a908a0ccb758dd8d",
  measurementId: "G-2KWFVJPBGD"
  // ... add any other configuration keys as required.
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/*
  Sign Out Function:
  This clears all localStorage EXCEPT the 'solvedLocks' variable.
*/
function signOut() {
  const solvedLocks = localStorage.getItem("solvedLocks");
  localStorage.clear();
  if (solvedLocks) {
    localStorage.setItem("solvedLocks", solvedLocks);
  }
  window.location.href = "index.html";
}

// Attach the sign-out event listener for any element with the class "sign-out"
document.addEventListener("DOMContentLoaded", () => {
  const signOutButtons = document.querySelectorAll(".sign-out");
  signOutButtons.forEach((button) => {
    button.addEventListener("click", signOut);
  });
});

/* ========================
   TEAM LOGIN LOGIC (index.html)
========================= */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const teamId = document.getElementById("teamId").value.trim();
    if (teamId) {
      // Store the team ID for future pages
      localStorage.setItem("teamId", teamId);

      // Check or create a Firebase record for this team
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) {
        await setDoc(teamRef, { solvedLocks: [] });
      }
      window.location.href = "menu.html";
    } else {
      alert("Please enter a valid Team ID.");
    }
  });
}

/* ========================
   MENU PAGE LOGIC (menu.html)
   - Build a grid of 20 locks arranged in a 5x4 layout.
   - Only the active (next unsolved) lock is clickable.
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const lockGrid = document.getElementById("lockGrid");
  if (lockGrid) {
    // Ensure a team is logged in
    if (!localStorage.getItem("teamId")) {
      window.location.href = "index.html";
    }

    // Retrieve solved locks from local storage (if any)
    let solvedLocks = JSON.parse(localStorage.getItem("solvedLocks") || "[]");
    // The next active lock is determined by the number of solved locks plus one.
    let activeLock = solvedLocks.length + 1;
    if (activeLock > 20) activeLock = 20;

    // Create grid cells for all 20 locks
    for (let i = 1; i <= 20; i++) {
      const lockDiv = document.createElement("div");
      lockDiv.classList.add("lock");

      // Create the lock image element
      const img = document.createElement("img");
      img.alt = "Lock " + i;
      if (solvedLocks.includes(i)) {
        img.src = "images/lock_unlocked.png";
      } else {
        img.src = "images/lock_locked.png";
      }
      lockDiv.appendChild(img);

      // Add a label showing the lock number
      const label = document.createElement("p");
      label.textContent = "Lock " + i;
      lockDiv.appendChild(label);

      // Make only the active (next unsolved) lock clickable
      if (i === activeLock && !solvedLocks.includes(i)) {
        lockDiv.addEventListener("click", () => {
          window.location.href = `lock.html?lock=${i}`;
        });
      } else {
        lockDiv.classList.add("disabled");
      }
      lockGrid.appendChild(lockDiv);
    }
  }
});

/* ========================
   LOCK PAGE LOGIC (lock.html)
   - Read the "lock" number from the URL.
   - Display an answer box.
   - Compare the user’s answer against a placeholder array of correct answers.
   - If correct, update localStorage (and Firebase) to record the solved lock.
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const lockForm = document.getElementById("lockForm");
  if (lockForm) {
    // Ensure a team is logged in
    if (!localStorage.getItem("teamId")) {
      window.location.href = "index.html";
    }

    // Retrieve the lock number from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const lockNumber = parseInt(params.get("lock"));
    if (isNaN(lockNumber)) {
      document.getElementById("feedback").textContent =
        "Invalid lock number.";
      lockForm.style.display = "none";
      return;
    }
    document.getElementById("lockTitle").textContent = "Lock " + lockNumber;

    // Placeholder answer lists for each lock
    const lockAnswers = {
      1: ["Nineteen", "19", "nineteen"],
      2: ["55.27"],
      3: ["28.7"],
      4: ["l", "L"],
      5: ["Harvey Dent"],
      6: ["🌖"],
      7: ["answer7", "Answer1", "a1"],
      8: ["answer8", "Answer2", "a2"],
      // Specific answers for locks 3 to 20 can be added here.
    };
    // Use default answers for any lock not explicitly set
    for (let i = 1; i <= 20; i++) {
      if (!lockAnswers[i]) {
        lockAnswers[i] = ["answer", "Answer"];
      }
    }

    // Check if this lock was already solved on this device
    let solvedLocks = JSON.parse(localStorage.getItem("solvedLocks") || "[]");
    if (solvedLocks.includes(lockNumber)) {
      document.getElementById("feedback").textContent =
        "This lock has already been solved on this device.";
      lockForm.style.display = "none";
      return;
    } 

    // Handle answer submission
    lockForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userAnswer = document.getElementById("lockAnswer").value.trim();
      if (
        lockAnswers[lockNumber].some(
          (ans) => ans.toLowerCase() === userAnswer.toLowerCase()
        )
      ) {
        // Correct answer – update localStorage and Firebase.
        solvedLocks.push(lockNumber);
        localStorage.setItem("solvedLocks", JSON.stringify(solvedLocks));

        // Update the team's record in Firebase
        const teamId = localStorage.getItem("teamId");
        if (teamId) {
          const teamRef = doc(db, "teams", teamId);
          const teamSnap = await getDoc(teamRef);
          let firebaseLocks = [];
          if (teamSnap.exists()) {
            firebaseLocks = teamSnap.data().solvedLocks || [];
          }
          if (!firebaseLocks.includes(lockNumber)) {
            firebaseLocks.push(lockNumber); 
          }
          await updateDoc(teamRef, { solvedLocks: firebaseLocks });
        } 
        document.getElementById("feedback").textContent =
          "Another epic point! Remember, don't forget to log out when you're done opening the locks!";
        document.getElementById("feedback").style.color = "#0EC912";
        document.getElementById("feedback").style.fontSize = "20px";
        document.getElementById("feedback").style.fontWeight = "bold";
        setTimeout(() => {
          window.location.href = "menu.html";
        }, 3000);
      } else {
        document.getElementById("feedback").textContent =
          "Well, you can't expect to get them all. Try again!";
          document.getElementById("feedback").style.color = "#c9392e";
          document.getElementById("feedback").style.fontSize = "20px";
          document.getElementById("feedback").style.fontWeight = "bold";
      }
    });
  }
});
